import * as orm from "typeorm";
import { DomainError } from "tstl/exception/DomainError";
import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { OutOfRange } from "tstl/exception/OutOfRange";
import { Singleton } from "tstl/thread/Singleton";

import { CapsuleNullable } from "../../typings/CapsuleNullable";
import { Creator } from "../../typings/Creator";
import { PrimaryColumnType } from "../../typings/PrimaryColumnType";
import { StringColumnType } from "../../typings/StringColumnType";
import { findRepository } from "../../functional/findRepository";

import { BelongsAccessorBase } from "../base/BelongsAccessorBase";
import { ClosureProxy } from "../base/ClosureProxy";
import { HasExternalOneToOne } from "./HasExternalOneToOne";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { RelationshipVariable } from "../base/RelationshipVariable";
import { get_primary_field } from "../base/get_primary_field";
import { take_index_option } from "../base/take_index_option";

export type BelongsExternalOneToOne<
        Target extends object,
        Type extends PrimaryColumnType,
        Options extends Partial<BelongsExternalOneToOne.IOptions<Type>> = {}>
    = BelongsExternalOneToOne.Accessor<Target, Type, Options>;

export function BelongsExternalOneToOne<
        Target extends object,
        Type extends PrimaryColumnType,
        Options extends Partial<BelongsExternalOneToOne.IOptions<Type>>>
    (
        targetGen: Creator.Generator<Target>, 
        type: Type,
        myField: string, 
        options?: Options
    ): PropertyDecorator;

export function BelongsExternalOneToOne<
        Mine extends object,
        Target extends object,
        Type extends PrimaryColumnType,
        Options extends Partial<BelongsExternalOneToOne.IOptions<Type>>>
    (
        targetGen: Creator.Generator<Target>, 
        inverse: (target: Target) => HasExternalOneToOne<Mine>,
        type: Type,
        myField: string, 
        options?: Options
    ): PropertyDecorator;

export function BelongsExternalOneToOne<
        Mine extends object,
        Target extends object,
        Type extends PrimaryColumnType,
        Options extends Partial<BelongsExternalOneToOne.IOptions<Type>>>
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

    return function ($class, $property)
    {
        // THE FOREIGN REFERENCING COLUMN
        if (options.primary === true)
            orm.PrimaryColumn(type, options as any)($class, foreign_key_field);
        else
        {
            orm.Column(type as any, take_index_option(options))($class, foreign_key_field);
            if (options.index === true)
                orm.Index()($class, foreign_key_field);
        }

        // DEFINE METADATA
        const metadata: BelongsExternalOneToOne.IMetadata<Target> = {
            type: "Belongs.External.OneToOne",
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

        // DEFINE THE ACCESSOR PROPERTY
        const label: string = RelationshipVariable.helper("belongs", $property as string);
        Object.defineProperty($class, $property,
        {
            get: function ()
            {
                if (this[label] === undefined)
                    this[label] = BelongsExternalOneToOne.Accessor.create(metadata, this);
                return this[label];
            }
        }); 
    }
}

export namespace BelongsExternalOneToOne 
{
    export interface IMetadata<T extends object>
    {
        type: "Belongs.External.OneToOne";
        target: () => Creator<T>;
        inverse: string | null;

        property: string;
        foreign_key_field: string;
        target_priamary_field: Singleton<string>;

        nullable: boolean;
    }

    export interface IOptions<Type extends PrimaryColumnType>
        extends Required<Omit<orm.RelationOptions, "primary"|"eager"|"lazy">>
    {
        index: boolean;
        primary: boolean;
        unique: boolean;
        unsigned: Type extends StringColumnType ? never : boolean;
        length: number;
    }

    export class Accessor<
            Target extends object,
            Type extends PrimaryColumnType,
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
                Type extends PrimaryColumnType,
                Options extends Partial<IOptions<Type>>>
            (
                metadata: IMetadata<Target>,
                mine: any,
            ): Accessor<Target, Type, Options>
        {
            return new Accessor(metadata, mine);
        }

        public get id(): CapsuleNullable<PrimaryColumnType.ValueType<Type>, Options>
        {
            return this.mine_[this.metadata_.foreign_key_field];
        }
        public set id(value: CapsuleNullable<PrimaryColumnType.ValueType<Type>, Options>)
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

            if (this.metadata_.inverse !== null)
                await (output as any)[this.metadata_.inverse].set(this.mine_);
            return output as CapsuleNullable<Target, Options>;
        }

        private get_null_error_message(symbol: string): string
        {
            return `Error on ${this.mine_.constructor.name}.${this.metadata_.property}.${symbol}: must not be null`;
        }
    }
}