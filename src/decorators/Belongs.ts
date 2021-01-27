import * as orm from "typeorm";
import { Model } from "../Model";

import { Has } from "./Has";

import { CapsuleNullable } from "../typings/CapsuleNullable";
import { CreatorType } from "../typings/CreatorType";
import { SpecialFields } from "../typings/SpecialFields";

export namespace Belongs
{
    /* -----------------------------------------------------------
        MANY-TO-ONE
    ----------------------------------------------------------- */
    export type ManyToOne<Target extends Model, Options extends Partial<ManyToOne.IOptions> = {}> = Helper<Target, Options>;

    export function ManyToOne<Target extends Model, Options extends Partial<ManyToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function ManyToOne<Mine extends Model, Target extends Model, Options extends Partial<ManyToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            inverse: SpecialFields<Target, Has.OneToMany<Mine>>,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function ManyToOne<Mine extends Model, Target extends Model, Options extends Partial<ManyToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            inverse: (target: Target) => Has.OneToMany<Mine>,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function ManyToOne(...args: any[]): PropertyDecorator
    {
        return typeof args[2] === "string"
            ? (_Belongs_to as Function)(orm.ManyToOne, ...args)
            : (_Belongs_to as Function)(orm.ManyToOne, args[0], undefined, ...args.slice(1));
    }

    export namespace ManyToOne
    {
        export interface IOptions
        {
            index: boolean;
            nullable: boolean;
        }
    }

    /* -----------------------------------------------------------
        ONE-TO-ONE
    ----------------------------------------------------------- */
    export type OneToOne<Target extends Model, Options extends Partial<OneToOne.IOptions> = {}> = Helper<Target, Options>;

    export function OneToOne<Target extends Model, Options extends Partial<OneToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function OneToOne<Mine extends Model, Target extends Model, Options extends Partial<OneToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            inverse: SpecialFields<Target, Has.OneToOne<Mine>>,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function OneToOne<Mine extends Model, Target extends Model, Options extends Partial<OneToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            inverse: (target: Target) => Has.OneToOne<Mine>,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function OneToOne(...args: any[]): PropertyDecorator
    {
        return typeof args[2] === "string"
            ? (_Belongs_to as Function)(orm.OneToOne, ...args)
            : (_Belongs_to as Function)(orm.OneToOne, args[0], undefined, ...args.slice(1));
    }
    export namespace OneToOne
    {
        export interface IOptions extends ManyToOne.IOptions
        {
            unique: boolean;
            primary: boolean;
        }
    }

    class Helper<Target extends Model, Options extends Partial<ManyToOne.IOptions>>
    {
        private readonly target_: CreatorType<Target>;
        private readonly source_: any;
        private readonly getter_: string;
        private readonly field_: string;
        private changed_: boolean;

        public constructor(target: CreatorType<Target>, source: ManyToOne.IOptions, property: string, field: string)
        {
            this.target_ = target;
            this.source_ = source;
            this.getter_ = `${property}_getter`;
            this.field_ = field;
            this.changed_ = false;
        }

        public get id(): CapsuleNullable<number, Options>
        {
            return this.source_[this.field_];
        }
        public set id(value: CapsuleNullable<number, Options>)
        {
            const previous: number | null = this.source_[this.field_];
            this.source_[this.field_] = value;

            if (previous !== value)
            {
                delete this.source_[`__${this.getter_}__`];
                delete this.source_[`__has_${this.getter_}__`];
                this.changed_ = true;
            }
        }

        public async get(): Promise<CapsuleNullable<Target, Options>>
        {
            const id: number | null = this.id;
            if (id === null)
                return null!;

            if (this.changed_ === true)
            {
                const loaded: Target | undefined = await orm.getRepository(this.target_).findOne(this.id!);
                this.source_[this.getter_] = Promise.resolve(loaded ? loaded : null);

                this.changed_ = true;
            }
            return await this.source_[this.getter_];
        }

        public set(obj: CapsuleNullable<Target, Options>): void
        {
            this.changed_ = false;
            this.source_[this.field_] = (obj !== null) ? obj.id : null!;
            this.source_[this.getter_] = Promise.resolve(obj);
        }

        public statement(alias: string): orm.QueryBuilder<Target>
        {
            return orm.getRepository(this.target_)
                .createQueryBuilder(alias)
                .andWhere(`${alias}.id = :id`, { id: this.id });
        }
    }

    function _Belongs_to<Mine extends Model, Target extends Model, Options extends object>
        (
            relation: typeof orm.ManyToOne | typeof orm.OneToOne,
            targetGen: () => CreatorType<Target>,
            inverse: SpecialFields<Target, Has.OneToMany<Mine> | Has.OneToOne<Mine>> | undefined,
            field: string,
            options?: Options
        ): PropertyDecorator
    {
        if (options === undefined)
            options = {} as Options;

        return function ($class, $property)
        {
            // LIST UP LABELS
            Reflect.defineMetadata(`SafeTypeORM:Belongs:${$property as string}`, $property, $class);
            Reflect.defineMetadata(`SafeTypeORM:Belongs:${$property as string}:field`, field, $class);
            Reflect.defineMetadata(`SafeTypeORM:Belongs:${$property as string}:target`, targetGen, $class);

            const getter: string = `${$property as string}_getter`;
            const label: string = `${$property as string}_helper`;
            
            orm.Column("int", { ...options, unsigned: true })($class, field);
            if (typeof inverse === "string")
                relation(targetGen, `${inverse}_getter`, { ...options, lazy: true })($class, getter);
            else
                relation(targetGen, { ...options, lazy: true })($class, getter);
            orm.JoinColumn({ name: field })($class, getter);

            Object.defineProperty($class, $property,
            {
                get: function (): Helper<Target, Options>
                {
                    if (this[label] === undefined)
                        this[label] = new Helper(targetGen(), this, $property as string, field);
                    return this[label];
                }
            });
        };
    }

    type TypeGenerator<Entity extends Model> = () => CreatorType<Entity>;
}