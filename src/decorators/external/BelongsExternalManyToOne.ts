import * as orm from "typeorm";
import { DomainError } from "tstl/exception/DomainError";
import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { OutOfRange } from "tstl/exception/OutOfRange";
import { Singleton } from "tstl/thread/Singleton";

import { CapsuleNullable } from "../../typings/CapsuleNullable";
import { Creator } from "../../typings/Creator";
import { PrimaryGeneratedColumn } from "../../typings/PrimaryGeneratedColumn";
import { findRepository } from "../../functional/findRepository";

import { BelongsAccessorBase } from "../base/BelongsAccessorBase";
import { ClosureProxy } from "../base/ClosureProxy";
import { HasExternalOneToMany } from "./HasExternalOneToMany";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { RelationshipVariable } from "../base/RelationshipVariable";
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
    const foreign_key_field: string = args[1];
    const options: Options = args[2] || {};

    // UUID LENGTH
    if (type === "uuid" && options.length === undefined)
        options.length = 36;

    return function ($class, $property)
    {
        // DECORATOR
        orm.Column(type as any, options)($class, foreign_key_field);

        // METADATA
        const metadata: BelongsExternalManyToOne.IMetadata<Target> = {
            type: "Belongs.External.ManyToOne",
            target,
            inverse: (inverse !== undefined) 
                ? ClosureProxy.steal(inverse) 
                : null,

            property: $property as string,
            foreign_key_field,
            target_priamary_field: new Singleton(() => get_primary_field(target())),

            nullable: !!options.nullable
        };
        ReflectAdaptor.set($class, $property, metadata);

        // ACCESSOR
        const label: string = RelationshipVariable.helper("belongs", $property as string);
        Object.defineProperty($class, $property,
        {
            get: function ()
            {
                if (this[label] === undefined)
                    this[label] = BelongsExternalManyToOne.Accessor.create(metadata, this);
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
        inverse: string | null;

        property: string;
        foreign_key_field: string;
        target_priamary_field: Singleton<string>;

        nullable: boolean;
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
                private readonly metadata_: IMetadata<Target>,
                private readonly mine_: any,
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
                metadata: IMetadata<Target>,
                mine: any,
            ): Accessor<Target, Type, Options>
        {
            return new Accessor(metadata, mine);
        }

        public get id(): CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options>
        {
            return this.mine_[this.metadata_.foreign_key_field];
        }
        public set id(value: CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options>)
        {
            if (value === this.id)
                return;

            this.mine_[this.metadata_.foreign_key_field] = value;
            this.singleton_ = new MutableSingleton(() => this._Get());
        }

        public async set(obj: CapsuleNullable<Target, Options>): Promise<void>
        {
            if (obj === null && this.metadata_.nullable === false)
                throw new DomainError(this.get_null_error_message("set()"));

            await this.singleton_.set(obj);
            this.mine_[this.metadata_.foreign_key_field] = (obj !== null)
                ? (obj as any)[this.metadata_.target_priamary_field.get()]
                : null;
        }

        /**
         * @internal
         */
        protected _Assign(obj: CapsuleNullable<Target, Options>): void
        {
            // VALIDATION
            if (obj === null && this.metadata_.nullable === false)
                throw new DomainError(this.get_null_error_message("initialize()"));

            // ENFORCED ASSIGNMENTS
            this.singleton_["value_"] = obj;
            this.mine_[this.metadata_.foreign_key_field] = (obj !== null)
                ? (obj as any)[this.metadata_.target_priamary_field.get()]
                : null;
        }

        public reload(): Promise<CapsuleNullable<Target, Options>>
        {
            return this.singleton_.reload();
        }

        public get(): Promise<CapsuleNullable<Target, Options>>
        {
            return this.singleton_.get();
        }

        private async _Get(): Promise<CapsuleNullable<Target, Options>>
        {
            const id = this.mine_[this.metadata_.foreign_key_field];
            const output: Target | undefined = await 
                findRepository(this.metadata_.target())
                .findOne(id);

            if (output === undefined)
                if (this.metadata_.nullable === false)
                    throw new OutOfRange(this.get_null_error_message("get()"));
                else
                    return null!;
            return output as CapsuleNullable<Target, Options>;
        }

        private get_null_error_message(symbol: string): string
        {
            return `Error on ${this.mine_.constructor.name}.${this.metadata_.property}.${symbol}: must not be null`;
        }
    }
}