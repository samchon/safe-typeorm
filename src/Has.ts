import * as orm from "typeorm";

import { CreatorType } from "./typings/CreatorType";

import { Belongs } from "./Belongs";
import { SpecialFields } from "./typings/SpecialFields";
import { Model } from "./Model";

export namespace Has
{
    export type OneToOne<Target extends Model> = Helper<Target, Target | null>;
    export function OneToOne<Mine extends Model, Target extends Model>
        (
            targetGen: TypeGenerator<Target>,
            inverse: SpecialFields<Target, Belongs.OneToOne<Mine, any>>
        ): PropertyDecorator
    {
        return _Has_one_to(orm.OneToOne, targetGen, inverse);
    }

    export type OneToMany<Target extends Model> = Helper<Target, Target[]>;
    export function OneToMany<Mine extends Model, Target extends Model>
        (
            targetGen: TypeGenerator<Target>,
            inverse: SpecialFields<Target, Belongs.ManyToOne<Mine, any>>
        ): PropertyDecorator
    {
        return _Has_one_to(orm.OneToMany, targetGen, inverse);
    }

    class Helper<Target extends Model, Ret>
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

        public statement(alias: string): orm.QueryBuilder<Target>
        {
            return orm.getRepository(this.target_)
                .createQueryBuilder(alias)
                .andWhere(`${alias}.${this.inverse_field_} = :id`, { id: this.source_.id });
        }
    }

    function _Has_one_to<
            Mine extends Model, 
            Target extends Model,
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

            const label: string = `${$property as string}_helper`;
            const getter: string = `${$property as string}_getter`;
            const inverseGetter: string = `${inverse}_getter`;

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

    type TypeGenerator<Entity extends Model> = () => CreatorType<Entity>;
}