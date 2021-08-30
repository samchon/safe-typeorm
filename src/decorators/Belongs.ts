import * as orm from "typeorm";
import { SharedMutex } from "tstl/thread/SharedMutex";
import { SharedLock } from "tstl/thread/SharedLock";
import { UniqueLock } from "tstl/thread/UniqueLock";

import { Has } from "./Has";
import { ClosureProxy } from "./internal/ClosureProxy";

import { CapsuleNullable } from "../typings/CapsuleNullable";
import { Creator } from "../typings/Creator";
import { SpecialFields } from "../typings/SpecialFields";
import { PrimaryGeneratedColumn } from "../typings/PrimaryGeneratedColumn";
import { ReflectAdaptor } from "./internal/ReflectAdaptor";

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
            Type extends PrimaryGeneratedColumn, 
            Options extends Partial<ManyToOne.IOptions<Type>> = {}> 
        = ManyToOne.Accessor<Target, Type, Options>;

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
            Type extends PrimaryGeneratedColumn,
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
            Type extends PrimaryGeneratedColumn,
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
         * @internal
         */
        export interface IMetadata<T extends object>
        {
            type: "Belongs.ManyToOne";
            target: () => Creator<T>;
            foreign_key_field: string;
            inverse: string | null;
        }
        
        export interface IOptions<Type extends PrimaryGeneratedColumn>
            extends Required<Omit<orm.RelationOptions, "primary"|"eager"|"lazy">>
        {
            index: boolean;
            primary: boolean;
            unsigned: Type extends "uuid" ? never : boolean;
            length: number;
        }

        export class Accessor<
                Target extends object, 
                Type extends PrimaryGeneratedColumn, 
                Options extends Partial<ManyToOne.IOptions<Type>>>
        {
            private readonly source_: any;
            private readonly getter_: string;
            private readonly mutex_: SharedMutex;

            private assigned_: Target | null;
            private changed_: boolean;

            private constructor
                (
                    private readonly target_: Creator<Target>, 
                    private readonly target_primary_field_: string, 
                    source: ManyToOne.IOptions<Type>, 
                    property: string, 
                    private readonly field_: string
                )
            {
                this.source_ = source;
                this.getter_ = getGetterField<any>(property);
                this.mutex_ = new SharedMutex();

                this.assigned_ = null;
                this.changed_ = false;
            }

            /**
             * @internal
             */
            public static create<
                    Target extends object, 
                    Type extends PrimaryGeneratedColumn, 
                    Options extends Partial<ManyToOne.IOptions<Type>>>
                (
                    target: Creator<Target>, 
                    targetPrimaryField: string, 
                    source: ManyToOne.IOptions<Type>, 
                    property: string, 
                    field: string
                ): Accessor<Target, Type, Options>
            {
                return new Accessor(target, targetPrimaryField, source, property, field);
            }

            /**
             * 
             */
            public get id(): CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options>
            {
                if (this.source_[this.field_] === null 
                    && this.assigned_ !== null 
                    && (this.assigned_ as any)[this.target_primary_field_] !== undefined)
                    this.source_[this.field_] = (this.assigned_ as any)[this.target_primary_field_];
                return this.source_[this.field_];
            }
            public set id(value: CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options>)
            {
                const previous: CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options> = this.source_[this.field_];
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
                const id: CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options> = this.id;
                if (id === null)
                    return null!;

                let output: CapsuleNullable<Target, Options>;
                if (this.changed_ === true)
                    await UniqueLock.lock(this.mutex_, async () =>
                    {
                        const loaded: Target | undefined = await orm.getRepository(this.target_).findOne(this.id!);
                        output = (loaded || null) as any;

                        this.changed_ = false;
                        this.source_[this.getter_] = Promise.resolve(output);
                    });
                else
                    await SharedLock.lock(this.mutex_, async () =>
                    {
                        output = await this.source_[this.getter_];
                    });
                return output!;
            }

            /**
             * 
             * @param obj 
             */
            public async set(obj: CapsuleNullable<Target, Options>): Promise<void>
            {
                await UniqueLock.lock(this.mutex_, async () =>
                {
                    this.assigned_ = obj;
                    this.changed_ = false;

                    this.source_[this.field_] = (obj !== null) ? (obj as any)[this.target_primary_field_] : null!;
                    this.source_[this.getter_] = Promise.resolve(obj);
                });
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
            Type extends PrimaryGeneratedColumn, 
            Options extends Partial<OneToOne.IOptions<Type>> = {}> 
        = OneToOne.Accessor<Target, Type, Options>;

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
            Type extends PrimaryGeneratedColumn,
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
            Type extends PrimaryGeneratedColumn,
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
         * @internal
         */
        export interface IMetadata<T extends object>
        {
            type: "Belongs.OneToOne";
            target: () => Creator<T>;
            foreign_key_field: string;
            inverse: string | null;
        }

        export interface IOptions<Type extends PrimaryGeneratedColumn>
            extends ManyToOne.IOptions<Type>
        {
            unique: boolean;
            length: number;
        }

        export import Accessor = ManyToOne.Accessor;
    }

    /* -----------------------------------------------------------
        COMMON
    ----------------------------------------------------------- */
    function _Belongs_to<
            Mine extends object, 
            Target extends object, 
            Type extends PrimaryGeneratedColumn, 
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
        if (type === "uuid" && options.length === undefined)
            options.length = 36;
        options = _Take_relation_options(options) as Options;
        

        return function ($class, $property)
        {
            // LIST UP LABELS
            const getter: string = getGetterField<any>($property as string);
            const label: string = getHelperField($property as string);
            let targetPrimaryField: string | null = null;
            
            // JOIN RELATIONSHIP
            const inverseField: string | null = (inverse !== undefined)
                ? ClosureProxy.steal(inverse)
                : null
            if (inverseField !== null)
                relation
                (
                    targetGen, 
                    Has.getGetterField(inverseField), 
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
            
            // DEFINE METADATAS
            const metadata: ManyToOne.IMetadata<Target> = {
                type: `Belongs.${relation.name as "ManyToOne"}`,
                target: targetGen,
                foreign_key_field: field,
                inverse: inverseField,
            }
            ReflectAdaptor.set($class, $property, metadata);

            // DEFINE THE ACCESSOR PROPERTY
            Object.defineProperty($class, $property,
            {
                get: function (): ManyToOne.Accessor<Target, Type, Options>
                {
                    if (this[label] === undefined)
                    {
                        if (targetPrimaryField === null)
                            targetPrimaryField = Has.getPrimaryField(`Belongs.${relation.name}`, targetGen());
                        
                        this[label] = ManyToOne.Accessor.create
                        (
                            targetGen(), 
                            targetPrimaryField, 
                            this, 
                            $property as string, 
                            field
                        );
                    }
                    return this[label];
                }
            });
        };
    }

    function _Take_relation_options<Type extends PrimaryGeneratedColumn>
        (options: OneToOne.IOptions<Type>): OneToOne.IOptions<Type>
    {
        const ret: OneToOne.IOptions<Type> = { ...options };
        if (ret.onDelete === undefined)
            ret.onDelete = "CASCADE";
        if (ret.onUpdate === undefined)
            ret.onUpdate = "CASCADE";
        return ret;
    }

    function _Take_column_options<Type extends PrimaryGeneratedColumn>
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
        HIDDEN ACCESSORS
    ----------------------------------------------------------- */
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