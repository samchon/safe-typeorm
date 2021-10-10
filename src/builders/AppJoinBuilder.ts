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

/**
 * Application level join builder.
 * 
 * `AppJoinBuilder` is a helper class who can perform the application level join very 
 * easily. With this `AppJoinBuilder`, you don't need to implement the application level 
 * joining script, with the {@link HashMap}, by yourself. The joining would be done by 
 * this `AppJoinBuilder` automatically.
 * 
 * Furthermore, you can build such `AppJoinBuilder` safely and convenienty. When you 
 * are building up an `AppJoinbuilder` instance from a specific ORM class, the 
 * `AppJoinBuilder` would analyze relationships of the target ORM class in the 
 * compilation level. Therefore, if you take any mistake, it would be detected in the
 * IDE directly. Also, when you're finding neighbor entities to join, `AppJoinBuilder` 
 * will hints you through the auto-completion.
 * 
 * ![Hints by the Auto Completion](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/demonstrations/app-join-builder.gif)
 * At last, interface of the `AppJoinBuilder` is same with the {@link JoinQueryBuilder},
 * another helper class who can implement SQL join very conveniently and safely. 
 * Therefore, you can convert between `AppJoinBuilder` and {@link JoinQueryBuilder} in 
 * anytime. Feel free to selecting one of them and convert them whenver you want.
 * 
 * ## What Application Join is:
 * The application level join means that joining related records are done not by the
 * SQL join query, but through the manual application code using the {@link HashMap}
 * with their primary and foreign column values.
 * 
 * Comparing those SQL join query and application level joining, the application level
 * joining consumes much fewer resources and its elapsed time is also much shorter than
 * the SQL join query. Those differences grow up whenever the join relationship be 
 * more complicate.
 * 
 * Type         | SQL Query | App Join
 * :------------|----------:|----------:
 * Records      | 2,258,000 | 165
 * Elapsed Time | 8.07508   | 0.00262
 * 
 * @template Mine Target entity to perform the app join
 * @reference [stackoverflow/join-queries-vs-multiple-queries](https://stackoverflow.com/questions/1067016/join-queries-vs-multiple-queries)
 * @author Jeongho Nam - https://github.com/samchon
 */
export class AppJoinBuilder<Mine extends object>
{
    private readonly mine_: Creator<Mine>;
    private readonly children_: Map<SpecialFields<Mine, Relationship<any>>, IAppJoinChildTuple<Mine>>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Default Constructor.
     * 
     * @param mine Target ORM class to perform the app joining
     */
    public constructor(mine: Creator<Mine>)
    {
        this.mine_ = mine;
        this.children_ = new Map();
    }

    /**
     * Configure a neighbor entity to join.
     * 
     * `AppJoinBuilder.join()` is a method configuring a neighbor entity to join, by 
     * specifying an accessor field of the *Mine* class, who've defined the 
     * relationship decorator with the target neighbor entity class.
     * 
     * You also can configure another app joining targets of the target neighbor
     * entity by writing *closure* function or calling additional methods to the 
     * returned `AppJoinBuilder` instance for the target neighbor entity. Of course,
     * such app join definition chaining would also benefic from the compilation type
     * checking and auto-completion hints.
     * 
     * If you've configured duplicated neighbor entity to join again, it will not affect to the app joining target. However, the *closure* function would be 
     * affected. Also, calling additional methods to the returned `AppJoinBuilder`
     * instance for the target entity would be affected, too.
     * 
     * @param field Field of *Mine* defined the relationship decorator with the target neighborhood entity
     * @param closure Closure function if you want to perform another app join from the target entity
     * @returns Emplaced `AppJoinBuilder` instance for the target entity
     */
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

    /**
     * Safe factory method for the `AppJoinBuilder`.
     * 
     * ## Unintended Mistake
     * When creating an `AppJoinBuilder` instance and configuring neighbor entities
     * to be joined through the {@link AppJoinBuilder.join} method, you can take a 
     * mistake that omitting a specific neighbor entity.
     * 
     * If you take such mistake, there would not be any compile-time and run-time error
     * would be occured. However, unintended SELECT statements would be repeatedly 
     * queried whenever you access to the specific relationship decorated member what 
     * you've omitted.
     * 
     * Therefore, if you take such mistake, you may failed to performance tuning 
     * through the application level joining plan.
     * 
     * ## Safe Initializer
     * To avoid such unintended mistake, you can use this factory method 
     * `AppJoinBuilder.initailize` with the {@link AppJoinBuilder.Initialized} typed
     * object instead of creating the `AppJoinBuilder` instance by yourself and 
     * configuring app joins through the {@link AppJoinBuilder.join} method. 
     * 
     * The {@link AppJoinBuilder.Initialized} type enforces you to list up all of the 
     * relationship decorated fields. Even if you don't want to join with a specific 
     * neighbor entity, the {@link AppJoinBuilder.Initialized} type compels you to 
     * assign the `undefined` value on the matched relationship decorated field.
     * 
     *   - Assignable properties
     *     - `undefined`: do not join with the neighbor
     *     - `"join"`: join with the neighbor, but no cascade app joinining
     *     - `AppJoinBuilder<Neighbor> instance`: join with the neighbor and continue cascade app joining through a `AppJoinBuilder` instance
     *     - {@link AppJoinBuilder.Closure}: join with the neighbor and continue cascade app joining through a closure function
     * 
     * @param creator Target ORM class to perform the app joining
     * @param input 
     * @returns 
     */
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

    /**
     * Execute the application join.
     * 
     * `AppJoinBuilder.execute()` is the final execution method performing the 
     * application level joining, who've defined by {@link AppJoinBuilder.join} or 
     * {@link AppJoinBuilder.initialize}, to the *data*. Therefore after the execution, 
     * the *data* record(s) would be linked to the specified neighbor entity records.
     * 
     * However, you should know that, this method can't predicate whether the execution
     * on the *data* is duplicated or not. Thus, if you've changed some properties of 
     * a linked entity record after the execution and call this execution method again, 
     * you may lose the modified property values.
     * 
     * @param data Target record (or list of records) to be joined
     */
    public async execute(data: Mine | Mine[]): Promise<void>
    {
        if (!(data instanceof Array))
            data = [ data ];
        await this._Execute(data);
    }

    private async _Execute(data: Mine[]): Promise<void>
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
                await child.builder._Execute(output);
        }
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    /**
     * Number of neighbor entities to be joined.
     */
    public get size(): number
    {
        return this.children_.size;
    }

    /**
     * Iterator of relationship decorator fields to be joined.
     */
    public keys(): IterableIterator<AppJoinBuilder.Key<Mine>>
    {
        return this.children_.keys();
    }

    /**
     * Iterator of neighbor entities to be joined.
     */
    public values(): IterableIterator<AppJoinBuilder.Value<Mine>>
    {
        return new ValueIterator(this.children_.values());
    }

    /**
     * Iterator of key-value pairs to be joined.
     */
    public entries(): IterableIterator<AppJoinBuilder.Entry<Mine>>
    {
        return new EntryIterator(this.children_.entries());
    }

    /**
     * For of iterator of entries to be joined. 
     */
    public [Symbol.iterator](): IterableIterator<AppJoinBuilder.Entry<Mine>>
    {
        return this.entries();
    }

    /**
     * Loop value-key pairs to be joined.
     * 
     * @param closure A function accepting value-key pairs for every elements
     */
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
    /**
     * Test whether a specific neighbor entity has been configured.
     * 
     * @param key Field of *Mine* defined the relationship decorator with the target neighbor entity
     * @returns Whether the specified neighbor entity has been configured or not
     */
    public has(key: SpecialFields<Mine, Relationship<any>>): boolean
    {
        return this.children_.has(key);
    }

    /**
     * Get an `AppJoinBuilder` instance of a specific neighbor entity.
     * 
     * @param field Field of *Mine* defined the relationship decorator with the target neighbor entity 
     * @returns 
     */
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

    /**
     * Assign an `AppJoinBuilder` instance to a specific field.
     * 
     * If you've already generated an `AppJoinBuilder` instance of the target neighbor 
     * entity to be joined, instead of re-generating the duplicated `AppJoinBuilder` 
     * instance by calling the {@link AppJoinBuilder.join} method, you can re-use the 
     * `AppJoinBuilder` instance through this `AppJoinBuilder.set()` method. 
     * 
     * @param field Field of *Mine* defined the relationship decorator with the target neighbor entity
     * @param builder Pre-generated `AppJoinBuilder` instance to be assigned
     * @returns This `AppJoinBuilder` instance
     */
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

    /**
     * Remove a specific neighbor entity to be joined.
     * 
     * @param field Field of *Mine* defined the relationship decorator with the target neighbor entity
     * @returns Whether the specified neighbor has been configured and succeeded to remove it or not
     */
    public delete<Field extends AppJoinBuilder.Key<Mine>>
        (field: Field): boolean
    {
        return this.children_.delete(field);
    }
}

export namespace AppJoinBuilder
{
    /**
     * Closure function type for the {@link AppJoinBuilder.join}.
     */
    export type Closure<T extends object> = (builder: AppJoinBuilder<T>) => void;
    
    /**
     * Key type of the {@link AppJsonBuilder}.
     */
    export type Key<T extends object> = SpecialFields<T, Relationship<any>>;
    
    /**
     * Value type of the {@link AppJsonBuilder}.
     */
    export type Value<T extends object> = AppJoinBuilder<Relationship.TargetType<T, any>>;
    
    /**
     * Entry type of the {@link AppJsonBuilder}.
     */
    export type Entry<T extends object> = [Key<T>, Value<T>];

    /**
     * Initializer type for the {@link AppJsonBuilder.initialize}
     */
    export type Initialized<Mine extends object> = OmitNever<
    {
        [P in keyof Mine]: Mine[P] extends Relationship<infer Target> 
            ? (AppJoinBuilder<Target> | undefined | Closure<Target> | "join") 
            : never;
    }>;

    /**
     * Maximum variable count of the parameter binding in one SQL query.
     */
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