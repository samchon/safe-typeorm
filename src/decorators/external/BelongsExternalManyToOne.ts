import * as orm from "typeorm";
import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { OutOfRange } from "tstl/exception/OutOfRange";

import { CapsuleNullable } from "../../typings/CapsuleNullable";
import { Creator } from "../../typings/Creator";
import { PrimaryGeneratedColumn } from "../../typings/PrimaryGeneratedColumn";

import { BelongsAccessorBase } from "../base/BelongsAccessorBase";
import { ClosureProxy } from "../base/ClosureProxy";
import { ColumnAccessor } from "../base/ColumnAccessor";
import { HasExternalOneToMany } from "./HasExternalOneToMany";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { findRepository } from "../../functional/findRepository";
import { get_primary_field } from "../base/get_primary_field";

export type BelongsExternalManyToOne<
        Target extends object,
        Type extends PrimaryGeneratedColumn,
        Options extends Partial<BelongsExternalManyToOne.IOptions<Type>> = {}>
    = BelongsExternalManyToOne.Accessor<Target, Type, Options>;

export function BelongsExternalManyToOne<
        Target extends object,
        Type extends PrimaryGeneratedColumn,
        Options extends Partial<BelongsExternalManyToOne.IOptions<Type>>>
    (
        targetGen: Creator.Generator<Target>, 
        type: Type,
        myField: string, 
        options?: Options
    ): PropertyDecorator;

export function BelongsExternalManyToOne<
        Mine extends object,
        Target extends object,
        Type extends PrimaryGeneratedColumn,
        Options extends Partial<BelongsExternalManyToOne.IOptions<Type>>>
    (
        targetGen: Creator.Generator<Target>, 
        inverse: (target: Target) => HasExternalOneToMany<Mine>,
        type: Type,
        myField: string, 
        options?: Options
    ): PropertyDecorator;

export function BelongsExternalManyToOne<
        Mine extends object,
        Target extends object,
        Type extends PrimaryGeneratedColumn,
        Options extends Partial<BelongsExternalManyToOne.IOptions<Type>>>
    (
        target: Creator.Generator<Target>, 
        ...args: any[]
    ): PropertyDecorator
{
    // LIST UP PARAMETERS
    const inverse = typeof args[0] === "function"
        ? args.splice(0, 1)[0]
        : undefined;
    const type: Type = args[0];
    const myField: string = args[1];
    const options: Options = args[2] || {};

    // UUID LENGTH
    if (type === "uuid" && options.length === undefined)
        options.length = 36;

    return function ($class, $property)
    {
        // THE FOREIGN REFERENCING COLUMN
        orm.Column(type as any, options)($class, myField);

        // DEFINE METADATA
        const metadata: BelongsExternalManyToOne.IMetadata<Target> = {
            type: "Belongs.External.ManyToOne",
            target,
            foreign_key_field: myField,
            inverse: (inverse !== undefined) 
                ? ClosureProxy.steal(inverse) 
                : null
        };
        ReflectAdaptor.set($class, $property, metadata);

        // DEFINE THE ACCESSOR PROPERTY
        const label: string = ColumnAccessor.helper("belongs", $property as string);
        Object.defineProperty($class, $property,
        {
            get: function ()
            {
                if (this[label] === undefined)
                    this[label] = BelongsExternalManyToOne.Accessor.create
                    (
                        target(),
                        get_primary_field("Belongs.External.ManyToOne", target()),
                        options,
                        this,
                        $property as string,
                        myField
                    );
                return this[label];
            }
        }); 
    }
}

export namespace BelongsExternalManyToOne
{
    /**
     * @internal
     */
    export interface IMetadata<T extends object>
    {
        type: "Belongs.External.ManyToOne";
        target: () => Creator<T>;
        foreign_key_field: string;
        inverse: string | null;
    }

    export interface IOptions<Type extends PrimaryGeneratedColumn>
        extends Required<Omit<orm.ColumnOptions, "primary">>
    {
        index: boolean;
        unsigned: Type extends "uuid" ? never : boolean;
        length: number;
    }

    export class Accessor<
            Target extends object,
            Type extends PrimaryGeneratedColumn,
            Options extends Partial<IOptions<Type>>>
        extends BelongsAccessorBase<Target, Type, Options>
    {
        private singleton_: MutableSingleton<CapsuleNullable<Target, Options>>;

        private constructor
            (
                private readonly target_: Creator<Target>,
                private readonly target_primary_field_: string,
                private readonly options_: Options,
                private readonly source_: any,
                private readonly property_: string,
                private readonly field_: string
            )
        {
            super();
            this.singleton_ = new MutableSingleton(() => this._Get());
        }

        /**
         * @internal
         */
        public static create<Target extends object,
                Type extends PrimaryGeneratedColumn,
                Options extends Partial<IOptions<Type>>>
            (
                target: Creator<Target>,
                target_primary_field: string,
                options: Options,
                source: any,
                property: string,
                field: string
            )
        {
            return new Accessor(target, target_primary_field, options, source, property, field);
        }

        public get id(): CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options>
        {
            return this.source_[this.field_];
        }
        public set id(value: CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options>)
        {
            if (value === this.id)
                return;

            this.source_[this.field_] = value;
            this.singleton_ = new MutableSingleton(() => this._Get());
        }

        public get(): Promise<CapsuleNullable<Target, Options>>
        {
            return this.singleton_.get();
        }

        public async set(obj: CapsuleNullable<Target, Options>): Promise<void>
        {
            await this.singleton_.set(obj);
            this.source_[this.field_] = (obj as any)[this.target_primary_field_];
        }

        private async _Get(): Promise<CapsuleNullable<Target, Options>>
        {
            const id = this.source_[this.field_];
            const output: Target | undefined = await findRepository(this.target_).findOne(id);

            if (output === undefined)
                if (!this.options_.nullable)
                    throw new OutOfRange(`Error on ${this.source_.constructor.name}.${this.property_}.get(): unable to find the matched record.`);
                else
                    return null!;
            return output;
        }
    }
}