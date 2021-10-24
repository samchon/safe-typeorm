import * as orm from "typeorm";
import { SharedLock } from "tstl/thread/SharedLock";
import { SharedMutex } from "tstl/thread/SharedMutex";
import { UniqueLock } from "tstl/thread/UniqueLock";

import { CapsuleNullable } from "../../typings/CapsuleNullable";
import { Creator } from "../../typings/Creator";
import { PrimaryGeneratedColumn } from "../../typings/PrimaryGeneratedColumn";
import { findRepository } from "../../functional/findRepository";

import { BelongsAccessorBase } from "../base/BelongsAccessorBase";
import { ClosureProxy } from "../base/ClosureProxy";
import { ColumnAccessor } from "../base/ColumnAccessor";
import { HasOneToMany } from "./HasOneToMany";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { get_primary_field } from "../base/get_primary_field";
import { take_default_cascade_options } from "../base/take_default_cascade_options";
import { take_foreign_column_options } from "../base/take_foreign_column_options";

/**
 * Type for a variable using the `Belongs.ManyToOne` decorator.
 * 
 * @template Target Type of the target model class who has this model class as 1: N
 * @template Type Type of a type for a primary key column of the *Target* model class
 * @template Options Type of the surplus options defining the foreign referencing column
 */
export type BelongsManyToOne<
        Target extends object, 
        Type extends PrimaryGeneratedColumn, 
        Options extends Partial<BelongsManyToOne.IOptions<Type>> = {}> 
    = BelongsManyToOne.Accessor<Target, Type, Options>;

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
export function BelongsManyToOne<
        Target extends object, 
        Type extends PrimaryGeneratedColumn,
        Options extends Partial<BelongsManyToOne.IOptions<Type>>>
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
export function BelongsManyToOne<
        Mine extends object,
        Target extends object, 
        Type extends PrimaryGeneratedColumn,
        Options extends Partial<BelongsManyToOne.IOptions<Type>>>
    (
        targetGen: Creator.Generator<Target>, 
        inverse: (target: Target) => HasOneToMany<Mine>,
        type: Type,
        myField: string, 
        options?: Options
    ): PropertyDecorator;

export function BelongsManyToOne<
        Mine extends object,
        Target extends object, 
        Type extends PrimaryGeneratedColumn,
        Options extends Partial<BelongsManyToOne.IOptions<Type>>>
    (
        targetGen: Creator.Generator<Target>,
        ...args: any[]
    ): PropertyDecorator
{
    // LIST UP PARAMETERS
    const inverse = typeof args[0] === "function"
        ? args.splice(0, 1)[0]
        : undefined;
    const type: Type = args[0];
    const myField: string = args[1];
    const options: Options = take_default_cascade_options(args[2] || {});

    // UUID LENGTH
    if (type === "uuid" && options.length === undefined)
        options.length = 36;
    
    return function ($class, $property)
    {
        // LIST UP LABELS
        const getter: string = ColumnAccessor.getter("belongs", $property as string);
        const label: string = ColumnAccessor.helper("belongs", $property as string);

        // JOIN RELATIONSHIP
        const inverseField: string | null = inverse
            ? ClosureProxy.steal(inverse)
            : null;
        if (inverseField !== null)
            orm.ManyToOne
            (
                targetGen,
                ColumnAccessor.getter("has", inverseField),
                options
            )
            ($class, getter);
        else
            orm.ManyToOne(targetGen, options)($class, getter);
        orm.JoinColumn({ name: myField })($class, getter);

        // THE FOREIGN REFERENCING COLUMN
        const columnOptions = take_foreign_column_options(options);
        orm.Column(<any>type, columnOptions)($class, myField);

        // DEFINE METADATA
        const metadata: BelongsManyToOne.IMetadata<Target> = {
            type: "Belongs.ManyToOne",
            target: targetGen,
            foreign_key_field: myField,
            inverse: inverseField,
        };
        ReflectAdaptor.set($class, $property, metadata);

        // DEFINE THE ACCESSOR PROPERTY
        Object.defineProperty($class, $property, 
        {
            get: function (): BelongsManyToOne.Accessor<Target, Type, Options>
            {
                if (this[label] === undefined)
                    this[label] = BelongsManyToOne.Accessor.create
                    (
                        targetGen(),
                        get_primary_field("Belongs.ManyToOne", targetGen()),
                        this,
                        $property as string,
                        myField
                    );
                return this[label];
            }
        });
    }
}

export namespace BelongsManyToOne
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
        extends Required<Omit<orm.RelationOptions, "primary"|"eager"|"lazy"|"unique">>
    {
        index: boolean;
        unsigned: Type extends "uuid" ? never : boolean;
        length: number;
    }

    export class Accessor<Target extends object,
            Type extends PrimaryGeneratedColumn,
            Options extends Partial<IOptions<Type>>>
        extends BelongsAccessorBase<Target, Type, Options>
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
                source: any, 
                property: string, 
                private readonly field_: string
            )
        {
            super();

            this.source_ = source;
            this.getter_ = ColumnAccessor.getter("belongs", property);
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
                Options extends Partial<IOptions<Type>>>
            (
                target: Creator<Target>, 
                targetPrimaryField: string, 
                source: any, 
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
                    const loaded: Target | undefined = await findRepository(this.target_).findOne(this.id!);
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
            return findRepository(this.target_)
                .createQueryBuilder(this.target_.name)
                .andWhere(`${this.target_.name}.id = :id`, { id: this.id });
        }
    }
}