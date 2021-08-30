import * as orm from "typeorm";
import { Pair } from "tstl/utility/Pair";
import { Belongs, Has } from "../decorators";

import { ReflectAdaptor } from "../decorators/internal/ReflectAdaptor";

import { Creator } from "../typings/Creator";
import { Relationship } from "../typings/Relationship";
import { SpecialFields } from "../typings/SpecialFields";
import { ITableInfo } from "../functional/internal/ITableInfo";
import { getWhereArguments } from "../functional";
import { JoinQueryBuilder } from "./JoinQueryBuilder";

export class AppJoinBuilder<Mine extends object>
{
    private readonly mine_: Creator<Mine>;
    private readonly children_: Map<SpecialFields<Mine, Relationship<any>>, IChild<Mine>>;

    public constructor(mine: Creator<Mine>)
    {
        this.mine_ = mine;
        this.children_ = new Map();
    }

    public join<Field extends SpecialFields<Mine, Relationship<any>>>
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

    /**
     * @internal
     */
    public async mount(data: Mine[]): Promise<void>
    {
        for (const [field, child] of this.children_.entries())
        {
            let output: Relationship.TargetType<Mine, any>[];
            if (child.metadata.type === "Belongs.ManyToOne" || child.metadata.type === "Belongs.OneToOne")
                output = await join_belongs_to(child as any, data, field);
            else if (child.metadata.type === "Has.OneToOne")
                output = await join_has_one_to_one(this.mine_, child as any, data, field);
            else if (child.metadata.type === "Has.OneToMany")
                output = await join_has_one_to_many(this.mine_, child as any, data, field);
            else
                output = await join_has_many_to_many(this.mine_, child as any, data, field);
            
            if (output.length !== 0)
                await child.builder.mount(output);
        }
    }
}

export namespace AppJoinBuilder
{
    export type Closure<T extends object> = (builder: AppJoinBuilder<T>) => void;
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
        child: IChild<any, Belongs.ManyToOne.IMetadata<any>>,
        data: any[], 
        field: any,
    ): Promise<any[]>
{
    // THE TARGET INFO
    const target: Creator<any> = child.metadata.target();
    const table: ITableInfo = ITableInfo.get(target);

    // LOAD TARGET DATA
    const idList: any[] = get_foreign_key_values(data, field);
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
        await tuple.first[field].set(tuple.second);

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
    for (const routerRecord of routeList)
    {
        const tuple: any = myDict.get(routerRecord[child.metadata.my_inverse].id)!;
        const targetRecord: any = await routerRecord[child.metadata.target_inverse].get();

        tuple.second.push(targetRecord);
        output.push(targetRecord);
    }
    for (const tuple of myDict.values())
        await tuple.first[field].set(tuple.second);

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