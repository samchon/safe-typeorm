import { DomainError } from "tstl/exception/DomainError";
import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { Singleton } from "tstl/thread/Singleton";
import * as orm from "typeorm";

import { findRepository } from "../../functional/findRepository";

import { CapsuleNullable } from "../../typings/CapsuleNullable";
import { Creator } from "../../typings/Creator";
import { PrimaryColumnType } from "../../typings/PrimaryColumnType";
import { StringColumnType } from "../../typings/StringColumnType";

import { BelongsAccessorBase } from "../base/BelongsAccessorBase";
import { ClosureProxy } from "../base/ClosureProxy";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { RelationshipVariable } from "../base/RelationshipVariable";
import { get_primary_field } from "../base/get_primary_field";
import { take_default_cascade_options } from "../base/take_default_cascade_options";
import { take_foreign_column_options } from "../base/take_foreign_column_options";
import { HasOneToMany } from "./HasOneToMany";

/**
 * Type for a variable using the `Belongs.ManyToOne` decorator.
 *
 * @template Target Type of the target model class who has this model class as 1: N
 * @template Type Type of a type for a primary key column of the *Target* model class
 * @template Options Type of the surplus options defining the foreign referencing column
 */
export type BelongsManyToOne<
    Target extends object,
    Type extends PrimaryColumnType,
    Options extends Partial<BelongsManyToOne.IOptions<Type>> = {},
> = BelongsManyToOne.Accessor<Target, Type, Options>;

/**
 * Decorator function for the "N: 1 belongs" relationship.
 *
 * @template Target Type of the target model class who has this model class as 1: N
 * @template Type Type of a type for a primary key column of the *Target* model class
 * @template Options Type of the surplus options describing the foreign referencing column
 * @param target A closure function returning the *Target* model class, who has this model
 *               class as 1: N. In other words, this model class belongs to the *Target*
 *               model class as N: 1
 * @param type Type of a primary key column of the *Target* model class
 * @param myField Column name of this table who references the *Target* table as a foreign key
 * @param options Surplus options decribing the foreign referencing column *myField*
 * @return The *PropertyDecorator* function
 */
export function BelongsManyToOne<
    Target extends object,
    Type extends PrimaryColumnType,
    Options extends Partial<BelongsManyToOne.IOptions<Type>>,
>(
    target: Creator.Generator<Target>,
    type: Type,
    myField: string,
    options?: Options,
): PropertyDecorator;

/**
 * Decorator funtion for the "N: 1 belongs" relationship.
 *
 * @template Mine Type of this model class who is using it, the `Belongs.ManyToOne` decorator
 * @template Target Type of the target model class who has this model class *Mine* as 1: N
 * @template Type Type of the primary key of the *Target* model class
 * @template Options Type of the surplus options describing the foreign referencing column
 * @param target A closure function returning the *Target* model class, who has this model
 *               class *Mine* as 1: N. In other words, this model class *Mine* belongs to
 *               the *Target* model class as N: 1
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
    Type extends PrimaryColumnType,
    Options extends Partial<BelongsManyToOne.IOptions<Type>>,
>(
    target: Creator.Generator<Target>,
    inverse: (target: Target) => HasOneToMany<Mine>,
    type: Type,
    myField: string,
    options?: Options,
): PropertyDecorator;

export function BelongsManyToOne<
    Mine extends object,
    Target extends object,
    Type extends PrimaryColumnType,
    Options extends Partial<BelongsManyToOne.IOptions<Type>>,
>(target: Creator.Generator<Target>, ...args: any[]): PropertyDecorator {
    // LIST UP PARAMETERS
    const inverse =
        typeof args[0] === "function" ? args.splice(0, 1)[0] : undefined;
    const type: Type = args[0];
    const myField: string = args[1];
    const options: Options = take_default_cascade_options(args[2] || {});

    return function ($class, $property) {
        //----
        // PRELIMINARIES
        //----
        // LIST UP PROPERTIES
        const label: string = RelationshipVariable.helper(
            "belongs",
            $property as string,
        );
        const getter: string = RelationshipVariable.getter(
            "belongs",
            $property as string,
        );
        const inverse_property: string | null = inverse
            ? ClosureProxy.steal(inverse)
            : null;

        // DECORATOR FUNCTIONS
        if (inverse_property !== null)
            orm.ManyToOne(
                target,
                RelationshipVariable.getter("has", inverse_property),
                options,
            )($class, getter);
        else orm.ManyToOne(target, options)($class, getter);
        orm.JoinColumn({ name: myField })($class, getter);
        orm.Column(<any>type, take_foreign_column_options(options))(
            $class,
            myField,
        );

        // INDEXING
        if (options.index === true) orm.Index()($class, myField);

        //----
        // DEFINITIONS
        //----
        // METADATA
        const metadata: BelongsManyToOne.IMetadata<Target> = {
            type: "Belongs.ManyToOne",
            target,
            inverse: inverse_property,

            property: $property as string,
            foreign_key_field: myField,
            getter,
            target_primary_field: new Singleton(() =>
                get_primary_field(target()),
            ),

            nullable: !!options.nullable,
        };
        ReflectAdaptor.set($class, $property, metadata);

        // ACCESSOR
        Object.defineProperty($class, $property, {
            get: function (): BelongsManyToOne.Accessor<Target, Type, Options> {
                if (this[label] === undefined)
                    this[label] = BelongsManyToOne.Accessor.create(
                        metadata,
                        this,
                    );
                return this[label];
            },
        });
    };
}

export namespace BelongsManyToOne {
    /**
     * @internal
     */
    export interface IMetadata<T extends object> {
        type: "Belongs.ManyToOne";
        target: () => Creator<T>;
        inverse: string | null;

        property: string;
        getter: string;
        foreign_key_field: string;
        target_primary_field: Singleton<string>;

        nullable: boolean;
    }

    export interface IOptions<Type extends PrimaryColumnType>
        extends Required<
            Omit<orm.RelationOptions, "primary" | "eager" | "lazy" | "unique">
        > {
        index: boolean;
        unsigned: Type extends StringColumnType ? never : boolean;
        length: number;
    }

    export class Accessor<
        Target extends object,
        Type extends PrimaryColumnType,
        Options extends Partial<IOptions<Type>>,
    > extends BelongsAccessorBase<Target, Type, Options> {
        private singleton_: MutableSingleton<CapsuleNullable<Target, Options>>;

        private constructor(
            private readonly metadata_: IMetadata<Target>,
            private readonly mine_: any,
        ) {
            super();
            this.singleton_ = new MutableSingleton(() => this._Get());
        }

        /**
         * @internal
         */
        public static create<
            Target extends object,
            Type extends PrimaryColumnType,
            Options extends Partial<IOptions<Type>>,
        >(
            metadata: IMetadata<Target>,
            mine: any,
        ): Accessor<Target, Type, Options> {
            return new Accessor(metadata, mine);
        }

        public get id(): CapsuleNullable<
            PrimaryColumnType.ValueType<Type>,
            Options
        > {
            const output = this.mine_[this.metadata_.foreign_key_field];
            if (
                (output === null || output === undefined) &&
                this.metadata_.nullable === false
            )
                throw new DomainError(this.get_null_error_message("id"));
            return output;
        }
        public set id(
            value: CapsuleNullable<PrimaryColumnType.ValueType<Type>, Options>,
        ) {
            if (value === null && this.metadata_.nullable === false)
                throw new DomainError(this.get_null_error_message("id"));

            const previous = this.mine_[this.metadata_.foreign_key_field];
            this.mine_[this.metadata_.foreign_key_field] = value;

            if (previous !== value) {
                this.singleton_ = new MutableSingleton(() => this._Get());
                delete this.mine_[`__${this.metadata_.getter}__`];
                delete this.mine_[`__has_${this.metadata_.getter}__`];
            }
        }

        public statement(): orm.QueryBuilder<Target> {
            const creator: Creator<Target> = this.metadata_.target();

            return findRepository(creator)
                .createQueryBuilder(creator.name)
                .andWhere(
                    `${creator.name}.${this.metadata_.target_primary_field} = :id`,
                    { id: this.id },
                );
        }

        public async set(obj: CapsuleNullable<Target, Options>): Promise<void> {
            // VALIDATION
            if (obj === null && this.metadata_.nullable === false)
                throw new DomainError(this.get_null_error_message("set()"));

            // CONFIGURE NEW RECORD
            const singleton = this.singleton_;
            await singleton.set(obj);

            // ASSIGN PROPERTIES
            if (singleton === this.singleton_) {
                this.mine_[this.metadata_.foreign_key_field] =
                    obj !== null
                        ? (obj as any)[
                              this.metadata_.target_primary_field.get()
                          ]
                        : null;
                this.mine_[`__${this.metadata_.getter}__`] = obj;
                this.mine_[`__has_${this.metadata_.getter}__`] = true;
            }
        }

        /**
         * @internal
         */
        protected _Assign(obj: CapsuleNullable<Target, Options>): void {
            // VALIDATION
            if (obj === null && this.metadata_.nullable === false)
                throw new DomainError(
                    this.get_null_error_message("initialize()"),
                );

            this.singleton_["value_"] = obj;
            this.mine_[this.metadata_.foreign_key_field] =
                obj !== null
                    ? (obj as any)[this.metadata_.target_primary_field.get()]
                    : null;
            this.mine_[`__${this.metadata_.getter}__`] = obj;
            this.mine_[`__has_${this.metadata_.getter}__`] = true;
        }

        public async reload(): Promise<CapsuleNullable<Target, Options>> {
            const id = this.id;
            if (id === null || id === undefined) {
                if (this.metadata_.nullable === false)
                    throw new DomainError(this.get_null_error_message("get()"));
                return null!;
            }
            return await this.singleton_.reload();
        }

        public async get(): Promise<CapsuleNullable<Target, Options>> {
            const id = this.id;
            if (id === null || id === undefined) {
                if (this.metadata_.nullable === false)
                    throw new DomainError(this.get_null_error_message("get()"));
                return null!;
            }
            return await this.singleton_.get();
        }

        private async _Get(): Promise<CapsuleNullable<Target, Options>> {
            const output: CapsuleNullable<Target, Options> = await this.mine_[
                this.metadata_.getter
            ];
            if (output === null && this.metadata_.nullable === false)
                throw new DomainError(this.get_null_error_message("get()"));

            return output;
        }

        private get_null_error_message(symbol: string): string {
            return `Error on ${this.mine_.constructor.name}.${this.metadata_.property}.${symbol}: must not be null`;
        }
    }
}
