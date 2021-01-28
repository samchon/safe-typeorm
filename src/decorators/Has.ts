import * as orm from "typeorm";
import { Singleton } from "tstl/thread/Singleton";

import { IEntity } from "../IEntity";
import { CreatorType } from "../typings/CreatorType";

import { Belongs } from "./Belongs";
import { SpecialFields } from "../typings/SpecialFields";

export namespace Has
{
    /**
     * @internal
     */
    export function getIndexField(field: string): string
    {
        return `__m_has_${field}_getter__`;
    }
    
    export function getHelperField(field: string): string
    {
        return `__m_has_${field}_helper__`;
    }

    /* -----------------------------------------------------------
        ONE-TO-ONE
    ----------------------------------------------------------- */
    export type OneToOne<Target extends IEntity<any>> = Helper<Target, Target | null>;
    export function OneToOne<Mine extends IEntity<any>, Target extends IEntity<any>>
        (
            targetGen: TypeGenerator<Target>,
            inverse: SpecialFields<Target, Belongs.OneToOne<Mine, any>>
        ): PropertyDecorator
    {
        return _Has_one_to(orm.OneToOne, targetGen, inverse);
    }

    /* -----------------------------------------------------------
        ONE-to-MANY
    ----------------------------------------------------------- */
    export type OneToMany<Target extends IEntity<any>> = Helper<Target, Target[]>;
    export function OneToMany<Mine extends IEntity<any>, Target extends IEntity<any>>
        (
            targetGen: TypeGenerator<Target>,
            inverse: SpecialFields<Target, Belongs.ManyToOne<Mine, any>>
        ): PropertyDecorator
    {
        return _Has_one_to(orm.OneToMany, targetGen, inverse);
    }

    class Helper<Target extends IEntity<any>, Ret>
    {
        private readonly source_: any;
        private readonly target_: CreatorType<Target>;
        private readonly inverse_field_: string;
        private readonly getter_: string;

        public constructor
            (
                source: any, 
                target: CreatorType<Target>, 
                inverseField: string,
                getter: string
            )
        {
            this.target_ = target;
            this.source_ = source;
            this.inverse_field_ = inverseField;
            this.getter_ = getter;
        }

        public get(): Promise<Ret>
        {
            return this.source_[this.getter_];
        }

        public set(obj: Ret): void
        {
            this.source_[this.getter_] = Promise.resolve(obj);
        }

        public statement(): orm.QueryBuilder<Target>
        {
            return orm.getRepository(this.target_)
                .createQueryBuilder(this.target_.name)
                .andWhere(`${this.target_.name}.${this.inverse_field_} = :id`, { id: this.source_.id });
        }
    }

    function _Has_one_to<
            Mine extends IEntity<any>, 
            Target extends IEntity<any>,
            Ret>
        (
            relation: typeof orm.OneToMany,
            targetGen: TypeGenerator<Target>,
            inverse: SpecialFields<Target, Belongs.ManyToOne<Mine, any>>
        ): PropertyDecorator
    {
        return function ($class, $property)
        {
            Reflect.defineMetadata(`SafeTypeORM:Has:${$property as string}:target`, targetGen, $class);
            Reflect.defineMetadata(`SafeTypeORM:Has:${$property as string}:inverse`, inverse, $class);

            const label: string = getHelperField($property as string);
            const getter: string = getIndexField($property as string);
            const inverseGetter: string = Belongs.getIndexField<any>(inverse);

            relation(targetGen, inverseGetter, { lazy: true })($class, getter);
            
            Object.defineProperty($class, $property,
            {
                get: function (): Helper<Target, Ret>
                {
                    if (this[label] === undefined)
                    {
                        const inverseField: string = Reflect.getMetadata(`SafeTypeORM:Belongs:${inverse}`, targetGen());
                        this[label] = new Helper(this, targetGen(), inverseField, getter)
                    }
                    return this[label];
                }
            });
        };
    }

    /* -----------------------------------------------------------
        MANY-TO-MANY
    ----------------------------------------------------------- */
    export type ManyToMany<Target extends IEntity<any>> = RouterHelper<Target>;
    export function ManyToMany<Mine extends IEntity<any>, Target extends IEntity<any>, Router extends IEntity<any>>
        (
            targetGen: TypeGenerator<Target>,
            routerGen: TypeGenerator<Router>,
            targetInverse: SpecialFields<Router, Belongs.ManyToOne<Target, any>>,
            myInverse: SpecialFields<Router, Belongs.ManyToOne<Mine, any>>
        ): PropertyDecorator
    {
        return function ($class, $property)
        {
            const label: string = getHelperField($property as string);

            Object.defineProperty($class, $property,
            {
                get: function (): RouterHelper<Target>
                {
                    if (this[label] === undefined)
                        this[label] = new RouterHelper
                        (
                            this, 
                            targetGen(), 
                            routerGen(), 
                            Reflect.getMetadata(`SafeTypeORM:Belongs:${targetInverse}:field`, routerGen().prototype), 
                            Reflect.getMetadata(`SafeTypeORM:Belongs:${myInverse}:field`, routerGen().prototype)
                        );
                    return this[label];
                }
            });
        };
    }

    class RouterHelper<Target extends IEntity<any>>
    {
        private readonly stmt_: orm.SelectQueryBuilder<Target>;
        private readonly getter_: Singleton<Target[]>;

        public constructor
            (
                mine: IEntity<any>, 
                targetFactory: CreatorType<Target>,
                routerFactory: CreatorType<IEntity<any>>,
                targetInverseField: string,
                myInverseField: string
            )
        {
            this.stmt_ = orm.getRepository(targetFactory)
                    .createQueryBuilder()
                    .innerJoin(routerFactory, routerFactory.name, `${targetFactory.name}.id = ${routerFactory.name}.${targetInverseField}`)
                    .andWhere(`${routerFactory.name}.${myInverseField} = :my_id`, { my_id: mine.id });
            this.getter_ = new Singleton(() => this.stmt_.getMany());
        }

        public get(): Promise<Target[]>
        {
            return this.getter_.get();
        }

        public statement(): orm.SelectQueryBuilder<Target>
        {
            return this.stmt_;
        }
    }

    type TypeGenerator<Entity extends IEntity<any>> = () => CreatorType<Entity>;
}