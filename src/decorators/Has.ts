import * as orm from "typeorm";
import { Singleton } from "tstl/thread/Singleton";

import { Creator } from "../typings/Creator";

import { Belongs } from "./Belongs";
import { ClosureProxy } from "./internal/ClosureProxy";

/**
 * Decorators for the "has" relationship.
 * 
 * `Has` is a module containing decorators who can represent the "has" relationship. 
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace Has
{
    /* ===========================================================
        REGULAR
            - ONE-TO-ONE
            - ONE-TO-MANY
            - BACKGROUND
    ==============================================================
        ONE-TO-ONE
    ----------------------------------------------------------- */
    /**
     * Type for a variable using the `Has.OneToOne` decorator.
     * 
     * @template Target Type of the target model class who belongs to this model class *Mine* as 1: 1
     * @template Ensure Whether existence of the 1:1 owned record can be assured.
     */
    export type OneToOne<Target extends object, Ensure extends boolean = false> = Helper<Target, Ensure extends true ? Target : Target | null>;

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
        return _Has_one_to(orm.OneToOne, targetGen, inverse);
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
    export type OneToMany<Target extends object> = Helper<Target, Target[]>;

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
     * @return The *PropertyDecorator* function
     */
    export function OneToMany<Mine extends object, Target extends object>
        (
            targetGen: Creator.Generator<Target>,
            inverse: (input: Target) => Belongs.ManyToOne<Mine, any>
        ): PropertyDecorator
    {
        return _Has_one_to(orm.OneToMany, targetGen, inverse);
    }

    /* -----------------------------------------------------------
        BACKGROUND
    ----------------------------------------------------------- */
    class Helper<Target extends object, Ret>
    {
        private readonly mine_: any;
        private readonly getter_: string;
        private readonly stmt_: orm.QueryBuilder<Target>

        private constructor
            (
                mine: any, 
                primaryField: string,
                target: Creator<Target>, 
                inverseField: string,
                getter: string
            )
        {
            this.mine_ = mine;
            this.getter_ = getter;
            this.stmt_ = orm.getRepository(target)
                .createQueryBuilder(target.name)
                .andWhere(`${target.name}.${inverseField} = :id`, { id: this.mine_[primaryField] });
        }

        /**
         * @internal
         */
        public static create<Target extends object, Ret>
            (
                mine: any, 
                primaryField: string,
                target: Creator<Target>, 
                inverseField: string,
                getter: string
            ): Helper<Target, Ret>
        {
            return new Helper(mine, primaryField, target, inverseField, getter);
        }

        /**
         * 
         */
        public get(): Promise<Ret>
        {
            return this.mine_[this.getter_];
        }

        /**
         * 
         * @param obj 
         */
        public set(obj: Ret): void
        {
            this.mine_[this.getter_] = Promise.resolve(obj);
        }

        /**
         * 
         */
        public statement(): orm.QueryBuilder<Target>
        {
            return this.stmt_.clone();
        }
    }

    function _Has_one_to<
            Mine extends object, 
            Target extends object,
            Ret>
        (
            relation: typeof orm.OneToMany,
            targetGen: Creator.Generator<Target>,
            inverseClosure: (input: Target) => Belongs.ManyToOne<Mine, any>
        ): PropertyDecorator
    {
        return function ($class, $property)
        {
            const inverse: string = ClosureProxy.steal(inverseClosure);
            Reflect.defineMetadata(`SafeTypeORM:Has:${$property as string}:target`, targetGen, $class);
            Reflect.defineMetadata(`SafeTypeORM:Has:${$property as string}:inverse`, inverse, $class);

            const label: string = getHelperField($property as string);
            const getter: string = getGetterField($property as string);
            const inverseGetter: string = Belongs.getGetterField<any>(inverse);

            relation(targetGen, inverseGetter, { lazy: true })($class, getter);

            let primaryField: string | null = null;
            
            Object.defineProperty($class, $property,
            {
                get: function (): Helper<Target, Ret>
                {
                    if (this[label] === undefined)
                    {
                        if (primaryField === null)
                            primaryField = getPrimaryField(`Has.${relation.name}`, targetGen());

                        const inverseField: string = Reflect.getMetadata(`SafeTypeORM:Belongs:${inverse}`, targetGen());
                        this[label] = Helper.create(this, primaryField, targetGen(), inverseField, getter)
                    }
                    return this[label];
                }
            });
        };
    }

    /* ===========================================================
        ROUTER
            - MANY-TO-MANY
            - ONE-TO-MANY-THROUGH
            - BACKGROUND
    ==============================================================
        MANY-TO-MANY
    ----------------------------------------------------------- */
    /**
     * Type for a variable using the `Has.ManyToMany` decorator.
     * 
     * @template Target Type of the target model, who has the N: N relationship with this model 
     *                  class *Mine*, through the *Route* model class
     */
    export type ManyToMany<Target extends object> = RouterHelper<Target>;

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
     * @return The *PropertyDecorator* function
     */
    export function ManyToMany<Mine extends object, Target extends object, Router extends object>
        (
            targetGen: Creator.Generator<Target>,
            routerGen: Creator.Generator<Router>,
            targetInverse: (router: Router) => Belongs.ManyToOne<Target, any>,
            myInverse: (router: Router) => Belongs.ManyToOne<Mine, any>
        ): PropertyDecorator
    {
        return function ($class, $property)
        {
            const label: string = getHelperField($property as string);
            let primaryFieldTuple: [string, string] | null = null;

            Object.defineProperty($class, $property,
            {
                get: function (): RouterHelper<Target>
                {
                    if (this[label] === undefined)
                    {
                        if (primaryFieldTuple === null)
                            primaryFieldTuple = [ getPrimaryField("Has.ManyToMany", this.constructor), getPrimaryField("Has.ManyToMany", targetGen()) ];

                        this[label] = new RouterHelper
                        (
                            this, 
                            targetGen(), 
                            routerGen(), 
                            Reflect.getMetadata(`SafeTypeORM:Belongs:${ClosureProxy.steal(targetInverse)}:field`, routerGen().prototype), 
                            Reflect.getMetadata(`SafeTypeORM:Belongs:${ClosureProxy.steal(myInverse)}:field`, routerGen().prototype),
                            primaryFieldTuple
                        );
                    }
                    return this[label];
                }
            });
        };
    }

    /* -----------------------------------------------------------
        BACKGROUND
    ----------------------------------------------------------- */
    class RouterHelper<Target extends object>
    {
        private readonly stmt_: orm.SelectQueryBuilder<Target>;
        private readonly getter_: Singleton<Target[]>;

        public constructor
            (
                mine: any, 
                targetFactory: Creator<Target>,
                routerFactory: Creator<object>,
                targetInverseField: string,
                myInverseField: string,
                primaryKeyTuple: [string, string]
            )
        {
            this.stmt_ = orm.getRepository(targetFactory)
                .createQueryBuilder()
                .innerJoin(routerFactory, routerFactory.name, `${targetFactory.name}.${primaryKeyTuple[1]} = ${routerFactory.name}.${targetInverseField}`)
                .andWhere(`${routerFactory.name}.${myInverseField} = :my_id`, { my_id: mine[primaryKeyTuple[0]] });
            this.getter_ = new Singleton(() => this.stmt_.getMany());
        }

        public get(): Promise<Target[]>
        {
            return this.getter_.get();
        }

        public statement(): orm.SelectQueryBuilder<Target>
        {
            return this.stmt_.clone();
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