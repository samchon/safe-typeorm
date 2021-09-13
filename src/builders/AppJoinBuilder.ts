import { ReflectAdaptor } from "../decorators/internal/ReflectAdaptor";

import { Creator } from "../typings/Creator";
import { OmitNever } from "../typings/OmitNever";
import { Relationship } from "../typings/Relationship";
import { SpecialFields } from "../typings/SpecialFields";

import { IAppJoinChildTuple } from "./internal/IAppJoinChildTuple";
import { app_join_belongs_to } from "./internal/app_join_belongs_to";
import { app_join_has_many_to_many } from "./internal/app_join_has_many_to_many";
import { app_join_has_one_to_many } from "./internal/app_join_has_one_to_many";
import { app_join_has_one_to_one } from "./internal/app_join_has_one_to_one";

export class AppJoinBuilder<Mine extends object>
{
    private readonly mine_: Creator<Mine>;
    private readonly children_: Map<SpecialFields<Mine, Relationship<any>>, IAppJoinChildTuple<Mine>>;

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
        let child: IAppJoinChildTuple<Mine> | undefined = this.children_.get(field);
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
            if (!value)
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
                output = await app_join_belongs_to(this.mine_, child as any, data, field);
            else if (child.metadata.type === "Has.OneToOne")
                output = await app_join_has_one_to_one(this.mine_, child as any, data, field);
            else if (child.metadata.type === "Has.OneToMany")
                output = await app_join_has_one_to_many(this.mine_, child as any, data, field);
            else
                output = await app_join_has_many_to_many(this.mine_, child as any, data, field);
            
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

    public get<Field extends AppJoinBuilder.Key<Mine>>
        (
            field: Field
        ): AppJoinBuilder<Relationship.TargetType<Mine, Field>> | undefined
    {
        const child = this.children_.get(field) as IAppJoinChildTuple<Relationship.TargetType<Mine, Field>> | undefined;
        return child !== undefined
            ? child.builder as any
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

    export type Initialized<Mine extends object> = OmitNever<
    {
        [P in keyof Mine]: Mine[P] extends Relationship<infer Target> 
            ? (AppJoinBuilder<Target> | undefined | Closure<Target> | "join") 
            : never;
    }>;

    export let MAX_VARIABLE_COUNT: number = 32700;
}

/* -----------------------------------------------------------
    ITERATORS
----------------------------------------------------------- */
/**
 * @internal
 */
class ValueIterator<Mine extends object>
    implements IterableIterator<AppJoinBuilder.Value<Mine>>
{
    public constructor
        (
            private readonly values_: IterableIterator<IAppJoinChildTuple<Mine>>
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
            private readonly entries_: IterableIterator<[AppJoinBuilder.Key<T>, IAppJoinChildTuple<T>]>
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