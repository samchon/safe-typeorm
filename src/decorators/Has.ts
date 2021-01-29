import * as orm from "typeorm";
import { Singleton } from "tstl/thread/Singleton";

import { CreatorType } from "../typings/CreatorType";

import { Belongs } from "./Belongs";
import { ClosureProxy } from "./internal/ClosureProxy";

export namespace Has
{
    /**
     * @internal
     */
    export function getGetterField(field: string): string
    {
        return `__m_has_${field}_getter__`;
    }
    
    export function getHelperField(field: string): string
    {
        return `__m_has_${field}_helper__`;
    }

    /* ===========================================================
        REGULAR
            - ONE-TO-ONE
            - ONE-TO-MANY
            - BACKGROUND
    ==============================================================
        ONE-TO-ONE
    ----------------------------------------------------------- */
    export type OneToOne<Target extends object> = Helper<Target, Target | null>;
    export function OneToOne<Mine extends object, Target extends object>
        (
            targetGen: TypeGenerator<Target>,
            inverse: (input: Target) =>  Belongs.OneToOne<Mine, any>
        ): PropertyDecorator
    {
        return _Has_one_to(orm.OneToOne, targetGen, inverse);
    }

    /* -----------------------------------------------------------
        ONE-TO-MANY
    ----------------------------------------------------------- */
    export type OneToMany<Target extends object> = Helper<Target, Target[]>;
    export function OneToMany<Mine extends object, Target extends object>
        (
            targetGen: TypeGenerator<Target>,
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

        public constructor
            (
                mine: any, 
                primaryField: string,
                target: CreatorType<Target>, 
                inverseField: string,
                getter: string,
            )
        {
            this.mine_ = mine;
            this.getter_ = getter;
            this.stmt_ = orm.getRepository(target)
                .createQueryBuilder(target.name)
                .andWhere(`${target.name}.${inverseField} = :id`, { id: this.mine_[primaryField] });
        }

        public get(): Promise<Ret>
        {
            return this.mine_[this.getter_];
        }

        public set(obj: Ret): void
        {
            this.mine_[this.getter_] = Promise.resolve(obj);
        }

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
            targetGen: TypeGenerator<Target>,
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
                            primaryField = get_primary_field(`Has.${relation.name}`, targetGen());

                        const inverseField: string = Reflect.getMetadata(`SafeTypeORM:Belongs:${inverse}`, targetGen());
                        this[label] = new Helper(this, primaryField, targetGen(), inverseField, getter)
                    }
                    return this[label];
                }
            });
        };
    }

    /**
     * @internal
     */
    export function get_primary_field(method: string, target: CreatorType<any>): string
    {
        const columns = orm.getRepository(target).metadata.primaryColumns;
        if (columns.length !== 1)
            throw new Error(`Error on @safe.${method}(): number of columns composing primary key of the ${target} table is not 1 but ${columns.length}.`);

        return columns[0].databaseName;
    }

    /* ===========================================================
        ROUTER
            - MANY-TO-MANY
            - ONE-TO-MANY-THROUGH
            - BACKGROUND
    ==============================================================
        MANY-TO-MANY
    ----------------------------------------------------------- */
    export type ManyToMany<Target extends object> = RouterHelper<Target>;
    export function ManyToMany<Mine extends object, Target extends object, Router extends object>
        (
            targetGen: TypeGenerator<Target>,
            routerGen: TypeGenerator<Router>,
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
                            primaryFieldTuple = [ get_primary_field("Has.ManyToMany", this.constructor), get_primary_field("Has.ManyToMany", targetGen()) ];

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
                targetFactory: CreatorType<Target>,
                routerFactory: CreatorType<object>,
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
}

type TypeGenerator<Entity extends object> = () => CreatorType<Entity>;