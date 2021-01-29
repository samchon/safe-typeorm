import * as orm from "typeorm";

import { Has } from "./Has";

import { CapsuleNullable } from "../typings/CapsuleNullable";
import { CreatorType } from "../typings/CreatorType";
import { SpecialFields } from "../typings/SpecialFields";
import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { PrimaryGeneratedColumnValueType } from "../typings/PrimaryGeneratedColumnValueType";
import { ClosureProxy } from "./internal/ClosureProxy";

export namespace Belongs
{
    /**
     * @internal
     */
    export function getGetterField<Entity extends object>
        (field: SpecialFields<Entity, ManyToOne<any, any, any> | OneToOne<any, any, any>>): string
    {
        return `__m_belongs_${field}_getter__`;
    }

    /**
     * @internal
     */
    export function getHelperField(field: string): string
    {
        return `__m_belongs_${field}_helper__`;
    }

    /* -----------------------------------------------------------
        MANY-TO-ONE
    ----------------------------------------------------------- */
    export type ManyToOne<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType, 
            Options extends Partial<ManyToOne.IOptions> = {}> 
        = Helper<Target, Type, Options>;

    export function ManyToOne<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType,
            Options extends Partial<ManyToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            type: Type,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function ManyToOne<
            Mine extends object,
            Target extends object, 
            Type extends PrimaryGeneratedColumnType,
            Options extends Partial<ManyToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            inverse: (target: Target) => Has.OneToMany<Mine>,
            type: Type,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function ManyToOne(...args: any[]): PropertyDecorator
    {
        return (typeof args[1] === "function")
            ? (_Belongs_to as Function)(orm.ManyToOne, ...args)
            : (_Belongs_to as Function)(orm.ManyToOne, args[0], undefined, ...args.slice(1));
    }

    export namespace ManyToOne
    {
        export interface IOptions
        {
            index: boolean;
            nullable: boolean;
            unsigned: boolean;
        }
    }

    /* -----------------------------------------------------------
        ONE-TO-ONE
    ----------------------------------------------------------- */
    export type OneToOne<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType, 
            Options extends Partial<OneToOne.IOptions> = {}> 
        = Helper<Target, Type, Options>;

    export function OneToOne<Target extends object, Options extends Partial<OneToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            type: PrimaryGeneratedColumnType,
            myField: string,
            options?: Options
        ): PropertyDecorator;

    export function OneToOne<Mine extends object, Target extends object, Options extends Partial<OneToOne.IOptions>>
        (
            targetGen: TypeGenerator<Target>, 
            inverse: (input: Target) => Has.OneToOne<Mine>,
            type: PrimaryGeneratedColumnType,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    export function OneToOne(...args: any[]): PropertyDecorator
    {
        return (typeof args[1] === "function")
            ? (_Belongs_to as Function)(orm.OneToOne, ...args)
            : (_Belongs_to as Function)(orm.OneToOne, args[0], undefined, ...args.slice(1));
    }
    export namespace OneToOne
    {
        export interface IOptions extends ManyToOne.IOptions
        {
            unsigned: boolean;
            unique: boolean;
            primary: boolean;
        }
    }

    /* -----------------------------------------------------------
        COMMON
    ----------------------------------------------------------- */
    function _Belongs_to<
            Mine extends object, 
            Target extends object, 
            Type extends PrimaryGeneratedColumnType, 
            Options extends object>
        (
            relation: typeof orm.ManyToOne | typeof orm.OneToOne,
            targetGen: () => CreatorType<Target>,
            inverse: ((input: Target) => (Has.OneToOne<Mine> | Has.OneToMany<Mine>)) | undefined,
            type: Type,
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

            const getter: string = getGetterField<any>($property as string);
            const label: string = getHelperField($property as string);
            let targetPrimaryField: string | null = null;
            
            if (typeof inverse === "function")
                relation
                (
                    targetGen, 
                    Has.getGetterField(ClosureProxy.steal(inverse)), 
                    { ...options, lazy: true })
                ($class, getter);
            else
                relation(targetGen, { ...options, lazy: true })($class, getter);
            orm.JoinColumn({ name: field })($class, getter);
            orm.Column({ type: type, ...options })($class, field);

            Object.defineProperty($class, $property,
            {
                get: function (): Helper<Target, Type, Options>
                {
                    if (this[label] === undefined)
                    {
                        if (targetPrimaryField === null)
                            targetPrimaryField = Has.get_primary_field(`Belongs.${relation.name}`, targetGen());
                        this[label] = new Helper(targetGen(), targetPrimaryField, this, $property as string, field);
                    }
                    return this[label];
                }
            });
        };
    }

    /* -----------------------------------------------------------
        HELPER
    ----------------------------------------------------------- */
    type TypeGenerator<Entity extends object> = () => CreatorType<Entity>;

    class Helper<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType, 
            Options extends Partial<ManyToOne.IOptions>>
    {
        private readonly target_: CreatorType<Target>;
        private readonly target_primary_field_: string;
        private readonly source_: any;
        private readonly getter_: string;
        private readonly field_: string;
        private changed_: boolean;

        public constructor(target: CreatorType<Target>, targetPrimaryField: string, source: ManyToOne.IOptions, property: string, field: string)
        {
            this.target_ = target;
            this.target_primary_field_ = targetPrimaryField;
            this.source_ = source;
            this.getter_ = getGetterField<any>(property);
            this.field_ = field;
            this.changed_ = false;
        }

        public get id(): CapsuleNullable<PrimaryGeneratedColumnValueType<Type>, Options>
        {
            return this.source_[this.field_];
        }
        public set id(value: CapsuleNullable<PrimaryGeneratedColumnValueType<Type>, Options>)
        {
            const previous: CapsuleNullable<PrimaryGeneratedColumnValueType<Type>, Options> = this.source_[this.field_];
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
            const id: CapsuleNullable<PrimaryGeneratedColumnValueType<Type>, Options> = this.id;
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
            this.source_[this.field_] = (obj !== null) ? (obj as any)[this.target_primary_field_] : null!;
            this.source_[this.getter_] = Promise.resolve(obj);
        }

        public statement(): orm.QueryBuilder<Target>
        {
            return orm.getRepository(this.target_)
                .createQueryBuilder(this.target_.name)
                .andWhere(`${this.target_.name}.id = :id`, { id: this.id });
        }
    }
}