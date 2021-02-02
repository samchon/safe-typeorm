import * as orm from "typeorm";

import { Has } from "./Has";
import { ClosureProxy } from "./internal/ClosureProxy";

import { CapsuleNullable } from "../typings/CapsuleNullable";
import { Creator } from "../typings/Creator";
import { SpecialFields } from "../typings/SpecialFields";
import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { PrimaryGeneratedColumnValueType } from "../typings/PrimaryGeneratedColumnValueType";

/**
 * Decorators for the "belongs" relationship.
 * 
 * `Belongs` is a module containing decorators who can represent the "belongs" relationship.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace Belongs
{
    /* -----------------------------------------------------------
        MANY-TO-ONE
    ----------------------------------------------------------- */
    /**
     * Type for a variable using the `Belongs.ManyToOne` decorator.
     * 
     * @template Target Type of the target model class who has this model class as 1: N
     * @template Type Type of a type for a primary key column of the *Target* model class
     * @template Options Type of the surplus options defining the foreign referencing column
     */
    export type ManyToOne<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType, 
            Options extends Partial<ManyToOne.IOptions<Type>> = {}> 
        = Helper<Target, Type, Options>;

    /**
     * Decorator function for the "N: 1 belongs" relationship.
     * 
     * @template Target Type of the target model class who has this model class as 1: N
     * @template Type Type of a type for a primary key column of the *Target* model class
     * @template Options Type of the surplus options describing the foreign referencing column
     * @param targetGen A closure function returning the *Target* model class, who has this model
     *                  class as 1: N. In other words, this model class belongs to the *Target*
     *                  model class as N: 1
     * @param type Type of a primary key column of the *Target* model class
     * @param myField Column name of this table who references the *Target* table as a foreign key
     * @param options Surplus options decribing the foreign referencing column *myField*
     * @return The *PropertyDecorator* function
     */
    export function ManyToOne<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType,
            Options extends Partial<ManyToOne.IOptions<Type>>>
        (
            targetGen: Creator.Generator<Target>, 
            type: Type,
            myField: string, 
            options?: Options
        ): PropertyDecorator;

    /**
     * Decorator funtion for the "N: 1 belongs" relationship.
     * 
     * @template Mine Type of this model class who is using it, the `Belongs.ManyToOne` decorator
     * @template Target Type of the target model class who has this model class *Mine* as 1: N
     * @template Type Type of the primary key of the *Target* model class
     * @template Options Type of the surplus options describing the foreign referencing column
     * @param targetGen A closure function returning the *Target* model class, who has this model
     *                  class *Mine* as 1: N. In other words, this model class *Mine* belongs to
     *                  the *Target* model class as N: 1
     * @param inverse A closure function returning the {@link Has.OneToMany} typed member variable,
     *                who is pointing this model class *Mine*, from the *Target* model class
     * @param type Type of a primary key column of the *Target* model class
     * @param myField Column name of *Mine* who references the *Target* table as a foreign key
     * @param options Surplus options decribing the foreign referencing column *myField*
     * @return The *PropertyDecorator* function
     */
    export function ManyToOne<
            Mine extends object,
            Target extends object, 
            Type extends PrimaryGeneratedColumnType,
            Options extends Partial<ManyToOne.IOptions<Type>>>
        (
            targetGen: Creator.Generator<Target>, 
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
        /**
         * 
         */
        export interface IOptions<Type extends PrimaryGeneratedColumnType>
            extends Required<Omit<orm.RelationOptions, "primary"|"eager"|"lazy">>
        {
            index: boolean;
            unsigned: Type extends "uuid" ? never : boolean;
        }
    }

    /* -----------------------------------------------------------
        ONE-TO-ONE
    ----------------------------------------------------------- */
    /**
     * Type of a variable using the `Belongs.OneToOne` decorator.
     * 
     * @template Target Type of the target model class who has this model class as 1: 1
     * @template Type Type of a type for a primary key column of the *Target* model class
     * @template Options Type of the surplus options defining the foreign referencing column
     */
    export type OneToOne<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType, 
            Options extends Partial<OneToOne.IOptions<Type>> = {}> 
        = Helper<Target, Type, Options>;

    /**
     * Decorator function for the "1: 1 belongs" relationship.
     * 
     * @template Target Type of the target model class who has this model class as 1: 1
     * @template Type Type of a type for a primary key column of the *Target* model class
     * @template Options Type of the surplus options describing the foreign referencing column
     * @param targetGen A closure function returning the *Target* model class, who has this model
     *                  class as 1: 1. In other words, this model class belongs to the *Target*
     *                  model class as 1: 1
     * @param type Type of a primary key column of the *Target* model class
     * @param myField Column name of this table who references the *Target* table as a foreign key
     * @param options Surplus options decribing the foreign referencing column *myField*
     * @return The *PropertyDecorator* function
     */
    export function OneToOne<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType,
            Options extends Partial<OneToOne.IOptions<Type>>>
        (
            targetGen: Creator.Generator<Target>, 
            type: Type,
            myField: string,
            options?: Options
        ): PropertyDecorator;

    /**
     * Decorator funtion for the "1: 1 belongs" relationship.
     * 
     * @template Mine Type of this model class who is using it, the `Belongs.OneToOne` decorator
     * @template Target Type of the target model class who has this model class *Mine* as 1: 1
     * @template Type Type of the primary key of the *Target* model class
     * @template Options Type of the surplus options describing the foreign referencing column
     * @param targetGen A closure function returning the *Target* model class, who has this model
     *                  class *Mine* as 1: 1. In other words, this model class *Mine* belongs to
     *                  the *Target* model class as 1: 1
     * @param inverse A closure function returning the {@link Has.OneToOne} typed member variable,
     *                who is pointing this model class *Mine*, from the *Target* model class
     * @param type Type of a primary key column of the *Target* model class
     * @param myField Column name of *Mine* who references the *Target* table as a foreign key
     * @param options Surplus options decribing the foreign referencing column *myField*
     * @return The *PropertyDecorator* function
     */
    export function OneToOne<
            Mine extends object, 
            Target extends object, 
            Type extends PrimaryGeneratedColumnType,
            Options extends Partial<OneToOne.IOptions<Type>>>
        (
            targetGen: Creator.Generator<Target>, 
            inverse: (input: Target) => Has.OneToOne<Mine>,
            type: Type,
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
        /**
         * 
         */
        export interface IOptions<Type extends PrimaryGeneratedColumnType>
            extends ManyToOne.IOptions<Type>
        {
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
            Options extends OneToOne.IOptions<Type>>
        (
            relation: typeof orm.ManyToOne | typeof orm.OneToOne,
            targetGen: () => Creator<Target>,
            inverse: ((input: Target) => (Has.OneToOne<Mine> | Has.OneToMany<Mine>)) | undefined,
            type: Type,
            field: string,
            options?: Options
        ): PropertyDecorator
    {
        if (options === undefined)
            options = {} as Options;
        options = _Take_relation_options(options) as Options;

        return function ($class, $property)
        {
            // LIST UP LABELS
            Reflect.defineMetadata(`SafeTypeORM:Belongs:${$property as string}`, $property, $class);
            Reflect.defineMetadata(`SafeTypeORM:Belongs:${$property as string}:field`, field, $class);
            Reflect.defineMetadata(`SafeTypeORM:Belongs:${$property as string}:target`, targetGen, $class);

            const getter: string = getGetterField<any>($property as string);
            const label: string = getHelperField($property as string);
            let targetPrimaryField: string | null = null;
            
            // JOIN RELATIONSHIP
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

            // THE FOREIGN REFERENCING COLUMN
            const columnOptions = _Take_column_options(options!);
            if (options!.primary === true)
                orm.PrimaryColumn(<any>type, columnOptions)($class, field);
            else
                orm.Column(<any>type, columnOptions)($class, field);

            // DEFINE THE ACCESSOR PROPERTY
            Object.defineProperty($class, $property,
            {
                get: function (): Helper<Target, Type, Options>
                {
                    if (this[label] === undefined)
                    {
                        if (targetPrimaryField === null)
                            targetPrimaryField = Has.getPrimaryField(`Belongs.${relation.name}`, targetGen());
                        this[label] = Helper.create(targetGen(), targetPrimaryField, this, $property as string, field);
                    }
                    return this[label];
                }
            });
        };
    }

    function _Take_relation_options<Type extends PrimaryGeneratedColumnType>
        (options: OneToOne.IOptions<Type>): OneToOne.IOptions<Type>
    {
        const ret: OneToOne.IOptions<Type> = { ...options };
        if (ret.onDelete === undefined)
            ret.onDelete = "CASCADE";
        if (ret.onUpdate === undefined)
            ret.onUpdate = "CASCADE";
        return ret;
    }

    function _Take_column_options<Type extends PrimaryGeneratedColumnType>
        (options: OneToOne.IOptions<Type>): Omit<OneToOne.IOptions<Type>, keyof orm.RelationOptions>
    {
        const ret: any = { ...options };
        for (const key of RELATION_PROPERTIES)
            if (ret[key] !== undefined)
                delete ret[key];
        return ret;
    }

    const RELATION_PROPERTIES: Array<keyof orm.RelationOptions> = [
        "cascade", 
        "onDelete",
        "onUpdate",
        "deferrable",
        "lazy", 
        "eager", 
        "persistence", 
        "orphanedRowAction"
    ];

    /* -----------------------------------------------------------
        HELPER
    ----------------------------------------------------------- */
    class Helper<
            Target extends object, 
            Type extends PrimaryGeneratedColumnType, 
            Options extends Partial<ManyToOne.IOptions<Type>>>
    {
        private readonly target_: Creator<Target>;
        private readonly target_primary_field_: string;
        private readonly source_: any;
        private readonly getter_: string;
        private readonly field_: string;
        private changed_: boolean;

        private constructor(target: Creator<Target>, targetPrimaryField: string, source: ManyToOne.IOptions<Type>, property: string, field: string)
        {
            this.target_ = target;
            this.target_primary_field_ = targetPrimaryField;
            this.source_ = source;
            this.getter_ = getGetterField<any>(property);
            this.field_ = field;
            this.changed_ = false;
        }

        /**
         * @internal
         */
        public static create<
                Target extends object, 
                Type extends PrimaryGeneratedColumnType, 
                Options extends Partial<ManyToOne.IOptions<Type>>>
            (target: Creator<Target>, targetPrimaryField: string, source: ManyToOne.IOptions<Type>, property: string, field: string): Helper<Target, Type, Options>
        {
            return new Helper(target, targetPrimaryField, source, property, field);
        }

        /**
         * 
         */
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

        /**
         * 
         */
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

        /**
         * 
         * @param obj 
         */
        public set(obj: CapsuleNullable<Target, Options>): void
        {
            this.changed_ = false;
            this.source_[this.field_] = (obj !== null) ? (obj as any)[this.target_primary_field_] : null!;
            this.source_[this.getter_] = Promise.resolve(obj);
        }

        /**
         * 
         */
        public statement(): orm.QueryBuilder<Target>
        {
            return orm.getRepository(this.target_)
                .createQueryBuilder(this.target_.name)
                .andWhere(`${this.target_.name}.id = :id`, { id: this.id });
        }
    }

    /* -----------------------------------------------------------
        HIDDEN ACCESSORS
    ----------------------------------------------------------- */
    /**
     * @internal
     */
    export const HELPER_TYPE = Helper;

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
}