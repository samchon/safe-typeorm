import * as orm from "typeorm";
import { Pair } from "tstl/utility/Pair";

import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";
import { ReflectAdaptor } from "../decorators/internal/ReflectAdaptor";

import { Creator } from "../typings/Creator";
import { Relationship } from "../typings/Relationship";
import { SpecialFields } from "../typings/SpecialFields";

import { ITableInfo } from "../functional/internal/ITableInfo";
import { getWhereArguments } from "../functional/getWhereArguments";

import { JoinQueryBuilder } from "./JoinQueryBuilder";
import { OmitNever } from "../typings/OmitNever";

export class AppJoinBuilder<Mine extends object>
{
    private readonly mine_: Creator<Mine>;
    private readonly children_: Map<SpecialFields<Mine, Relationship<any>>, IChild<Mine>>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public constructor(mine: Creator<Mine>)
    {
        this.mine_ = mine;
        this.children_ = new Map();
    }

    public join<Field extends AppJoinBuilder.Key<Mine>>
        (
            field: Field,
            closure?: AppJoinBuilder.Closure<Relationship.TargetType<Mine, Field>>
        ): AppJoinBuilder<Relationship.TargetType<Mine, Field>>
    {
        // PREPARE BUILDER
        let child: IChild<Mine> | undefined = this.children_.get(field);
        if (child === undefined)
        {
            const metadata: ReflectAdaptor.Metadata<Relationship.TargetType<Mine, Field>> = ReflectAdaptor.get(this.mine_.prototype, field)!;
            const builder: AppJoinBuilder<Relationship.TargetType<Mine, Field>> = new AppJoinBuilder(metadata.target());

            child = { metadata, builder };
            this.children_.set(field, child);
        }

        // CALL CLOSURE
        if (closure !== undefined)
            closure(child.builder);

        // RETURNS BUILDER
        return child.builder;
    }

    public static initialize<Mine extends object>
        (
            creator: Creator<Mine>, 
            input: AppJoinBuilder.Initialized<Mine>
        ): AppJoinBuilder<Mine>
    {
        const builder: AppJoinBuilder<Mine> = new AppJoinBuilder(creator);
        for (const [key, value] of Object.entries(input))
            if (value === null)
                continue;
            else if (value === "join")
                builder.join(key as AppJoinBuilder.Key<Mine>);
            else if (typeof value === "function")
                builder.join(key as AppJoinBuilder.Key<Mine>, value as AppJoinBuilder.Closure<Relationship.TargetType<Mine, any>>);
            else
                builder.set(key as AppJoinBuilder.Key<Mine>, value as AppJoinBuilder<any>);
        return builder;
    }

    public async execute(data: Mine[]): Promise<void>
    {
        for (const [field, child] of this.children_.entries())
        {
            // JOIN WITH RELATED ENTITIES
            let output: Relationship.TargetType<Mine, any>[];
            if (child.metadata.type === "Belongs.ManyToOne" || child.metadata.type === "Belongs.OneToOne")
                output = await join_belongs_to(child as any, data, field);
            else if (child.metadata.type === "Has.OneToOne")
                output = await join_has_one_to_one(this.mine_, child as any, data, field);
            else if (child.metadata.type === "Has.OneToMany")
                output = await join_has_one_to_many(this.mine_, child as any, data, field);
            else
                output = await join_has_many_to_many(this.mine_, child as any, data, field);
            
            // HIERARCHICAL CALL
            if (output.length !== 0)
                await child.builder.execute(output);
        }
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    public get size(): number
    {
        return this.children_.size;
    }

    public keys(): IterableIterator<AppJoinBuilder.Key<Mine>>
    {
        return this.children_.keys();
    }

    public values(): IterableIterator<AppJoinBuilder.Value<Mine>>
    {
        return new ValueIterator(this.children_.values());
    }

    public entries(): IterableIterator<AppJoinBuilder.Entry<Mine>>
    {
        return new EntryIterator(this.children_.entries());
    }

    public [Symbol.iterator](): IterableIterator<AppJoinBuilder.Entry<Mine>>
    {
        return this.entries();
    }

    public forEach
        (
            closure: 
                (
                    value: AppJoinBuilder.Value<Mine>, 
                    key: AppJoinBuilder.Key<Mine>, 
                    thisArg: AppJoinBuilder<Mine>
                ) => void
        ): void
    {
        for (const tuple of this)
            closure(tuple[1], tuple[0], this);
    }

    /* -----------------------------------------------------------
        ELEMENTS I/O
    ----------------------------------------------------------- */
    public has(key: SpecialFields<Mine, Relationship<any>>): boolean
    {
        return this.children_.has(key);
    }

    public get(key: AppJoinBuilder.Key<Mine>): AppJoinBuilder.Value<Mine> | undefined
    {
        const child: IChild<Mine> | undefined = this.children_.get(key);
        return child !== undefined
            ? child.builder
            : undefined;
    }

    public set<Field extends AppJoinBuilder.Key<Mine>>
        (
            field: Field,
            builder: AppJoinBuilder<Relationship.TargetType<Mine, Field>>
        ): this
    {
        const metadata: ReflectAdaptor.Metadata<Relationship.TargetType<Mine, Field>> = ReflectAdaptor.get(this.mine_.prototype, field)!;
        this.children_.set(field, {
            metadata,
            builder
        });
        return this;
    }

    public delete<Field extends AppJoinBuilder.Key<Mine>>
        (field: Field): boolean
    {
        return this.children_.delete(field);
    }
}

export namespace AppJoinBuilder
{
    export type Closure<T extends object> = (builder: AppJoinBuilder<T>) => void;
    export type Key<T extends object> = SpecialFields<T, Relationship<any>>;
    export type Value<T extends object> = AppJoinBuilder<Relationship.TargetType<T, any>>;
    export type Entry<T extends object> = [Key<T>, Value<T>];

    export type Initialized<Mine extends object> = OmitNever<{
        [P in keyof Mine]: Mine[P] extends Relationship<infer Target> 
            ? (AppJoinBuilder<Target> | null | Closure<Target> | "join") 
            : never;
    }>;
}

/**
 * @internal
 */
interface IChild<
        Mine extends object, 
        Metadata extends ReflectAdaptor.Metadata<Relationship.TargetType<Mine, any>> = ReflectAdaptor.Metadata<Relationship.TargetType<Mine, any>>>
{
    metadata: Metadata;
    builder: AppJoinBuilder<Relationship.TargetType<Mine, any>>;
}

/**
 * @internal
 */
async function join_belongs_to
    (
        child: IChild<any, Belongs.ManyToOne.IMetadata<any> | Belongs.OneToOne.IMetadata<any>>,
        data: any[], 
        field: any,
    ): Promise<any[]>
{
    // NO DATA
    if (data.length === 0)
        return [];

    // NO REFERENCE
    const idList: any[] = get_foreign_key_values(data, field);
    if (idList.length === 0)
        return [];

    // THE TARGET INFO
    const target: Creator<any> = child.metadata.target();
    const table: ITableInfo = ITableInfo.get(target);
    const isOneToOne = child.metadata.type === "Belongs.OneToOne";

    // LOAD TARGET DATA
    const output: any[] = await orm.getRepository(target)
        .createQueryBuilder()
        .andWhere(...getWhereArguments(target, table.primaryColumn as "id", "IN", idList))
        .getMany();

    // LINK RELATIONSHIPS
    const dict: Map<any, any> = associate(table, output);
    for (const elem of data)
    {
        const id: any | null = elem[field].id;
        if (id === null)
            continue;

        const reference: any = dict.get(id)!;
        await elem[field].set(reference);

        if (isOneToOne === true && child.metadata.inverse !== null)
            await reference[child.metadata.inverse].set(elem);
    }
    return output;
}

/**
 * @internal
 */
async function join_has_one_to_one
    (
        mine: Creator<any>,
        child: IChild<any, Has.OneToOne.IMetadata<any>>,
        data: any[], 
        field: any,
    ): Promise<any[]>
{
    if (data.length === 0)
        return [];

    // MY TABLE & DATA
    const myTable: ITableInfo = ITableInfo.get(mine);
    const myDict: Map<any, Pair<any, any | null>> = associate(myTable, data, elem => new Pair(elem, null));
    const myIdList: any[] = data.map(rec => rec[myTable.primaryColumn]);
    
    // LOAD TARGET DATA
    const target: Creator<any> = child.metadata.target();
    const output: any[] = await orm.getRepository(target)
        .createQueryBuilder()
        .andWhere(...getWhereArguments(target, child.metadata.inverse as "id", "IN", myIdList))
        .getMany();

    // LINK RELATIONSHIPS
    for (const targetRecord of output)
    {
        const tuple: any = myDict.get(targetRecord[child.metadata.inverse].id)!;
        tuple.second = targetRecord;
        await targetRecord[child.metadata.inverse].set(tuple.first);
    }
    for (const tuple of myDict.values())
        await tuple.first[field].set(tuple.second);

    return output;
}

/**
 * @internal
 */
async function join_has_one_to_many
    (
        mine: Creator<any>,
        child: IChild<any, Has.OneToMany.IMetadata<any>>,
        data: any[],
        field: any
    ): Promise<any[]>
{
    if (data.length === 0)
        return [];

    // MY TABLE & DATA
    const myTable: ITableInfo = ITableInfo.get(mine);
    const myDict: Map<any, Pair<any, any[]>> = associate(myTable, data, elem => new Pair(elem, []));
    const myIdList: any[] = data.map(rec => rec[myTable.primaryColumn]);

    // LOAD TARGET DATA
    const target: Creator<any> = child.metadata.target();
    const output: any[] = await orm.getRepository(target)
        .createQueryBuilder()
        .andWhere(...getWhereArguments(target, child.metadata.inverse as "id", "IN", myIdList))
        .getMany();

    // LINK RELATIONSHIPS
    for (const targetRecord of output)
    {
        const tuple: Pair<any, any[]> = myDict.get(targetRecord[child.metadata.inverse].id)!;
        tuple.second.push(targetRecord);
        await targetRecord[child.metadata.inverse].set(tuple.first);
    }
    for (const tuple of myDict.values())
    {
        if (child.metadata.comparator)
            tuple.second = tuple.second.sort(child.metadata.comparator);
        await tuple.first[field].set(tuple.second);
    }
    return output;
}

async function join_has_many_to_many
    (
        mine: Creator<any>,
        child: IChild<any, Has.ManyToMany.IMetadata<any, any>>,
        data: any[],
        field: any
    ): Promise<any[]>
{
    if (data.length === 0)
        return [];

    // MY TABLE & DATA
    const myTable: ITableInfo = ITableInfo.get(mine);
    const myDict: Map<any, Pair<any, any[]>> = associate(myTable, data, elem => new Pair(elem, []));
    const myIdList: any[] = data.map(rec => rec[myTable.primaryColumn]);

    // LOAD TARGET DATA
    const router: Creator<any> = child.metadata.router();
    const stmt: orm.SelectQueryBuilder<any> = orm
        .getRepository(router)
        .createQueryBuilder()
        .andWhere(...getWhereArguments(router, child.metadata.my_inverse as "id", "IN", myIdList));
    new JoinQueryBuilder(stmt, router).innerJoinAndSelect(child.metadata.target_inverse);

    const routeList: any[] = await stmt.getMany();
    const output: any[] = [];

    // LINK RELATIONSHIPS
    for (const router of routeList)
    {
        const entry: any = myDict.get(router[child.metadata.my_inverse].id)!;
        const target: any = await router[child.metadata.target_inverse].get();

        const tuple: Has.ManyToMany.ITuple<any, any> = {
            router: router,
            target: target,
        };
        entry.second.push(tuple);
        output.push(target);
    }
    for (const entry of myDict.values())
    {
        if (child.metadata.comparator)
            entry.second = entry.second.sort(child.metadata.comparator);
        await entry.first[field].set(entry.second.map(elem => elem.target));
    }
    return output;
}

/**
 * @internal
 */
function get_foreign_key_values<
        T extends { [P in Field]: Belongs.ManyToOne<any, any, any> },
        Field extends SpecialFields<T, Belongs.ManyToOne<any, any, any>>>
    (data: T[], field: Field): any[]
{
    const idList: any[] = data
        .map(elem => elem[field].id)
        .filter(id => id !== null);
    return [...new Set(idList)];
}

/**
 * @internal
 */
function associate
    (
        info: ITableInfo, 
        records: any[],
        valueGen: (record: any) => any = (record => record)
    ): Map<any, any>
{
    const dict: Map<any, any> = new Map();
    for (const elem of records)
        dict.set(elem[info.primaryColumn], valueGen(elem));
    return dict;
}

/**
 * @internal
 */
class ValueIterator<Mine extends object>
    implements IterableIterator<AppJoinBuilder.Value<Mine>>
{
    public constructor
        (
            private readonly values_: IterableIterator<IChild<Mine>>
        )
    {
    }

    public next(): IteratorResult<AppJoinBuilder.Value<Mine>>
    {
        const it = this.values_.next();
        if (it.done === true)
            return it;

        return {
            done: false,
            value: it.value.builder
        };
    }

    public [Symbol.iterator](): IterableIterator<AppJoinBuilder.Value<Mine>>
    {
        return this;
    }
}

/**
 * @internal
 */
class EntryIterator<T extends object>
    implements IterableIterator<AppJoinBuilder.Entry<T>>
{
    public constructor
        (
            private readonly entries_: IterableIterator<[AppJoinBuilder.Key<T>, IChild<T>]>
        )
    {
    }

    public next(): IteratorResult<AppJoinBuilder.Entry<T>>
    {
        const it = this.entries_.next();
        if (it.done === true)
            return it;

        return {
            done: false,
            value: [ it.value[0], it.value[1].builder ]
        };
    }

    public [Symbol.iterator](): IterableIterator<AppJoinBuilder.Entry<T>>
    {
        return this;
    }
}