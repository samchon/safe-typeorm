import * as orm from "typeorm";
import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { SharedMutex } from "tstl/thread/SharedMutex";
import { SharedLock } from "tstl/thread/SharedLock";
import { UniqueLock } from "tstl/thread/UniqueLock";

import { Creator } from "../typings/Creator";
import { Comparator } from "../typings/Comparator";

import { Belongs } from "./Belongs";
import { ClosureProxy } from "./internal/ClosureProxy";
import { ReflectAdaptor } from "./internal/ReflectAdaptor";

/**
 * Decorators for the "has" relationship.
 * 
 * `Has` is a module containing decorators who can represent the "has" relationship. 
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace Has
{
    /* -----------------------------------------------------------
        ONE-TO-ONE
    ----------------------------------------------------------- */
    /**
     * Type for a variable using the `Has.OneToOne` decorator.
     * 
     * @template Target Type of the target model class who belongs to this model class *Mine* as 1: 1
     * @template Ensure Whether existence of the 1:1 owned record can be assured.
     */
    export type OneToOne<Target extends object, Ensure extends boolean = false>
        = OneToOne.Accessor<Target, Ensure extends true ? Target : Target | null>;

    /**
     * Decorator function for the "1: 1 has" relationship.
     * 
     * @template Mine Type of this model class who is using it, the `Has.OneToOne` decorator
     * @template Target Type of the target model class who belongs to this model class *Mine* as 1: 1
     * @param targetGen A closure function returning the *Target* model class who belongs to this 
     *                  model class *Mine* as 1: 1
     * @param inverse A closure function returning the {@link Belongs.OneToOne} typed member 
     *                variable, who is pointing this model class *Mine*, from the *Target* model 
     *                class
     * @return The *PropertyDecorator* function
     */
    export function OneToOne<Mine extends object, Target extends object>
        (
            targetGen: Creator.Generator<Target>,
            inverse: (input: Target) =>  Belongs.OneToOne<Mine, any>
        ): PropertyDecorator
    {
        return _Has_one_to
        (
            orm.OneToOne, 
            targetGen, 
            inverse,
            (mine, primary, getter, inverse) => OneToOne.Accessor.create
                (
                    mine, 
                    primary, 
                    targetGen(), 
                    getter, 
                    inverse
                )
        );
    }

    export namespace OneToOne
    {
        /**
         * @internal
         */
        export interface IMetadata<T extends object>
        {
            type: "Has.OneToOne";
            target: () => Creator<T>;
            inverse: string;
        }

        export class Accessor<Target extends object, Output extends Target | null>
        {
            private readonly stmt_: orm.QueryBuilder<Target>;
            private readonly mutex_: SharedMutex;

            private constructor
                (
                    private readonly mine_: any, 
                    primaryField: string,
                    target: Creator<Target>, 
                    private readonly getter_: string,
                    inverseField: string,
                )
            {
                this.stmt_ = orm.getRepository(target)
                    .createQueryBuilder(target.name)
                    .andWhere(`${target.name}.${inverseField} = :id`, { id: this.mine_[primaryField] });
                this.mutex_ = new SharedMutex();
            }

            /**
             * @internal
             */
            public static create<Target extends object, Output extends Target | null>
                (
                    mine: any, 
                    primaryField: string,
                    target: Creator<Target>, 
                    getter: string,
                    inverseField: string
                ): Accessor<Target, Output>
            {
                return new Accessor(mine, primaryField, target, getter, inverseField);
            }

            public async get(): Promise<Output>
            {
                let output: Output;
                await SharedLock.lock(this.mutex_, async () =>
                {
                    output = await this.mine_[this.getter_];
                });
                return output!;
            }

            public async set(target: Output): Promise<void>
            {
                await UniqueLock.lock(this.mutex_, () =>
                {
                    this.mine_[this.getter_] = Promise.resolve(target);
                });
            }

            public statement(): orm.QueryBuilder<Target>
            {
                return this.stmt_.clone();
            }
        }
    }

    /* -----------------------------------------------------------
        ONE-TO-MANY
    ----------------------------------------------------------- */
    /**
     * Type for a variable using the `Has.OneToMany` decorator.
     * 
     * @template Target Type of the target model class who belongs to this model class *Mine* as 
     *                  1: N
     */
    export type OneToMany<Target extends object> = OneToMany.Accessor<Target>;

    /**
     * Decorator function for the "1: N has" relationship.
     * 
     * @template Mine Type of this model class who is using it, the `Has.OneToMany` decorator
     * @template Target Type of the target model class who belongs to this model class *Mine* as 
     *                  N: 1
     * @param targetGen A closure function returning the *Target* model class who belongs this 
     *                  model class *Mine* as 1: N
     * @param inverse A closure funnction returning the {@link Belongs.ManyToOne} typed member 
     *                variable, who is pointing this model class *Mine*, from the *Target* model 
     *                class
     * @param comp Comparator for sorting if required.
     * @return The *PropertyDecorator* function
     */
    export function OneToMany<Mine extends object, Target extends object>
        (
            targetGen: Creator.Generator<Target>,
            inverse: (input: Target) => Belongs.ManyToOne<Mine, any>,
            comp?: Comparator<Target>
        ): PropertyDecorator
    {
        return _Has_one_to
        (
            orm.OneToMany, 
            targetGen, 
            inverse, 
            (mine, primary, getter, inverse) => OneToMany.Accessor.create
                (
                    mine, 
                    primary, 
                    targetGen(), 
                    getter, 
                    inverse, 
                    comp
                ),
            comp
        );
    }

    export namespace OneToMany
    {
        /**
         * @internal
         */
        export interface IMetadata<Target extends object>
        {
            type: "Has.OneToMany";
            target: () => Creator<Target>;
            inverse: string;
            comparator?: Comparator<Target>;
        }

        export class Accessor<Target extends object>
        {
            private readonly stmt_: orm.QueryBuilder<Target>;
            private readonly mutex_: SharedMutex;
            private sorted_?: boolean;

            private constructor
                (
                    private readonly mine_: any, 
                    primaryField: string,
                    target: Creator<Target>, 
                    private readonly getter_: string,
                    inverseField: string,
                    private readonly comp_: Comparator<Target> | undefined,
                )
            {
                this.stmt_ = orm.getRepository(target)
                    .createQueryBuilder(target.name)
                    .andWhere(`${target.name}.${inverseField} = :id`, { id: this.mine_[primaryField] });
                this.mutex_ = new SharedMutex();

                if (this.comp_ !== undefined)
                    this.sorted_ = false;
            }

            /**
             * @internal
             */
            public static create<Target extends object>
                (
                    mine: any, 
                    primaryField: string,
                    target: Creator<Target>, 
                    getter: string,
                    inverseField: string,
                    comp: Comparator<Target> | undefined,
                ): Accessor<Target>
            {
                return new Accessor(mine, primaryField, target, getter, inverseField, comp);
            }

            public async get(): Promise<Target[]>
            {
                let output: Target[];
                await SharedLock.lock(this.mutex_, async () =>
                {
                    output = await this.mine_[this.getter_];
                    if (this.comp_ !== undefined && this.sorted_ === false)
                    {
                        output = output.sort(this.comp_);
                        this.sorted_ = true;
                    }
                });
                return output!;
            }

            public async set(target: Target[]): Promise<void>
            {
                await UniqueLock.lock(this.mutex_, () =>
                {
                    this.mine_[this.getter_] = Promise.resolve(target);
                    this.sorted_ = true;
                });
            }

            public statement(): orm.QueryBuilder<Target>
            {
                return this.stmt_.clone();
            }
        }
    }

    function _Has_one_to<
            Mine extends object, 
            Target extends object,
            Accessor extends object>
        (
            relation: typeof orm.OneToMany,
            targetGen: Creator.Generator<Target>,
            inverseClosure: (input: Target) => Belongs.ManyToOne<Mine, any>,
            accessorGen: 
                (
                    mine: Mine,
                    primaryField: string, 
                    getter: string, 
                    inverseField: string
                ) => Accessor,
            comparator?: Comparator<Target>
        ): PropertyDecorator
    {
        return function ($class, $property)
        {
            const inverse: string = ClosureProxy.steal(inverseClosure);
            const metadata: OneToMany.IMetadata<Target> = {
                type: `Has.${relation.name as "OneToMany"}`,
                target: targetGen,
                inverse: inverse,
                comparator
            };
            ReflectAdaptor.set($class, $property, metadata);

            const label: string = getHelperField($property as string);
            const getter: string = getGetterField($property as string);
            const inverseGetter: string = Belongs.getGetterField<any>(inverse);

            relation(targetGen, inverseGetter, { lazy: true })($class, getter);

            let primaryField: string | null = null;
            
            Object.defineProperty($class, $property,
            {
                get: function (): Accessor
                {
                    if (this[label] === undefined)
                    {
                        if (primaryField === null)
                            primaryField = getPrimaryField(`Has.${relation.name}`, targetGen());

                        this[label] = accessorGen(this, primaryField, getter, inverse)
                    }
                    return this[label];
                }
            });
        };
    }

    /* -----------------------------------------------------------
        MANY-TO-MANY
    ----------------------------------------------------------- */
    /**
     * Type for a variable using the `Has.ManyToMany` decorator.
     * 
     * @template Target Type of the target model, who has the N: N relationship with this model 
     *                  class *Mine*, through the *Route* model class
     * @tempalte Router Type of the router model, who intermediates the M: N relationship.
     */
    export type ManyToMany<Target extends object, Router extends object> = ManyToMany.Accessor<Target, Router>;

    /**
     * Decorator function for the "N:N has" relationship.
     * 
     * @template Mine Type of this model class who is using it, the `Has.ManyToMany` decorator
     * @template Target Type of the target model class, who has the N: N relationship with this 
     *                  model class *Mine*, through the *Route* model class
     * @template Router Type of the router model who intermediates those *Mine* and *Route* model 
     *                  classes to resolve the N: N relationship
     * @param targetGen A closure function returning the *Target* model class, who has the N: N
     *                  relationship with this model class *Mine* through the *Route* model class
     * @param routerGen A closure function returning the *Router* model class, who intermediates
     *                  those *Mine* and *Route* model classes to resolve the N: N relationship
     * @param targetInverse A closure function returning the {@link Belongs.ManyToOne} typed member
     *                      variable, who is pointing this model class *Mine*, from the *Route* 
     *                      model class
     * @param myInverse A closure function returning the {@link Belongs.ManyToOne} typed member
     *                  variable, who is poining the target model class *Target*, from the *Rote*
     *                  mode class
     * @param comparator Comparator for sorting if required.
     * @return The *PropertyDecorator* function
     */
    export function ManyToMany<
            Mine extends object, 
            Target extends object, 
            Router extends object>
        (
            targetGen: Creator.Generator<Target>,
            routerGen: Creator.Generator<Router>,
            targetInverse: (router: Router) => Belongs.ManyToOne<Target, any>,
            myInverse: (router: Router) => Belongs.ManyToOne<Mine, any>,
            comparator?: Comparator<ManyToMany.ITuple<Target, Router>>
        ): PropertyDecorator
    {
        return function ($class, $property)
        {
            const label: string = getHelperField($property as string);
            let primaryFieldTuple: [string, string] | null = null;

            const metadata: ManyToMany.IMetadata<Target, Router> = {
                type: "Has.ManyToMany",
                target: targetGen,
                router: routerGen,
                target_inverse: ClosureProxy.steal(targetInverse),
                my_inverse: ClosureProxy.steal(myInverse),
                comparator
            };
            ReflectAdaptor.set($class, $property, metadata as any);

            Object.defineProperty($class, $property,
            {
                get: function (): ManyToMany.Accessor<Target, Router>
                {
                    if (this[label] === undefined)
                    {
                        if (primaryFieldTuple === null)
                            primaryFieldTuple = [ getPrimaryField("Has.ManyToMany", this.constructor), getPrimaryField("Has.ManyToMany", targetGen()) ];

                        const router: Creator<Router> = routerGen();
                        this[label] = ManyToMany.Accessor.create
                        (
                            this, 
                            targetGen(), 
                            router, 
                            metadata.target_inverse,
                            (ReflectAdaptor.get(routerGen().prototype, metadata.target_inverse) as Belongs.ManyToOne.IMetadata<Router>).foreign_key_field,
                            (ReflectAdaptor.get(routerGen().prototype, metadata.my_inverse) as Belongs.ManyToOne.IMetadata<Router>).foreign_key_field,
                            primaryFieldTuple,
                            comparator
                        );
                    }
                    return this[label];
                }
            });
        };
    }
    export namespace ManyToMany
    {
        /**
         * @internal
         */
        export interface IMetadata<Target extends object, Router extends object>
        {
            type: "Has.ManyToMany";
            target: () => Creator<Target>;
            router: () => Creator<Router>;
            target_inverse: string;
            my_inverse: string;
            comparator?: Comparator<ManyToMany.ITuple<Target, Router>>;
        }

        export interface ITuple<Target extends object, Router extends object>
        {
            target: Target;
            router: Router;
        }

        export class Accessor<Target extends object, Router extends object>
        {
            private readonly stmt_: orm.SelectQueryBuilder<Router>;
            private readonly getter_: MutableSingleton<Target[]>;

            private constructor
                (
                    mine: any, 
                    targetFactory: Creator<Target>,
                    routerFactory: Creator<Router>,
                    targetField: string,
                    targetInverseField: string,
                    myInverseField: string,
                    primaryKeyTuple: [string, string],
                    comp?: Comparator<ITuple<Target, Router>>
                )
            {
                this.stmt_ = orm.getRepository(routerFactory)
                    .createQueryBuilder(routerFactory.name)
                    .innerJoin(targetFactory, targetFactory.name, `${targetFactory.name}.${primaryKeyTuple[1]} = ${routerFactory.name}.${targetInverseField}`)
                    .andWhere(`${routerFactory.name}.${myInverseField} = :my_id`, { my_id: mine[primaryKeyTuple[0]] });
                this.getter_ = new MutableSingleton(async () => 
                {
                    const routerList: Router[] = await this.stmt_.getMany();
                    let tupleList: ManyToMany.ITuple<Target, Router>[] = [];

                    for (const router of routerList)
                        tupleList.push({
                            router,
                            target: await (router as any)[targetField].get()
                        });
                    if (comp)
                        tupleList = tupleList.sort(comp);

                    return tupleList.map(({ target }) => target);
                });
            }

            public static create<Target extends object, Router extends object>
                (
                    mine: any, 
                    targetFactory: Creator<Target>,
                    routerFactory: Creator<Router>,
                    targetField: string,
                    targetInverseField: string,
                    myInverseField: string,
                    primaryKeyTuple: [string, string],
                    comp?: Comparator<ITuple<Target, Router>>
                ): Accessor<Target, Router>
            {
                return new Accessor<Target, Router>(mine, targetFactory, routerFactory, targetField, targetInverseField, myInverseField, primaryKeyTuple, comp);
            }

            public get(): Promise<Target[]>
            {
                return this.getter_.get();
            }

            public set(value: Target[]): Promise<void>
            {
                return this.getter_.set(value);
            }

            public statement(): orm.SelectQueryBuilder<Router>
            {
                return this.stmt_;
            }
        }
    }

    /* -----------------------------------------------------------
        HIDDEN ACCESSORS
    ----------------------------------------------------------- */
    /**
     * @internal
     */
    export function getGetterField(field: string): string
    {
        return `__m_has_${field}_getter__`;
    }
    
    /**
     * @internal
     */
    export function getHelperField(field: string): string
    {
        return `__m_has_${field}_helper__`;
    }

    /**
     * @internal
     */
    export function getPrimaryField(method: string, target: Creator<any>): string
    {
        const columns = orm.getRepository(target).metadata.primaryColumns;
        if (columns.length !== 1)
            throw new Error(`Error on @safe.${method}(): number of columns composing primary key of the ${target} table is not 1 but ${columns.length}.`);

        return columns[0].databaseName;
    }
}