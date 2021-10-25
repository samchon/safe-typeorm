import * as orm from "typeorm";
import { DomainError } from "tstl/exception/DomainError";
import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { Singleton } from "tstl/thread/Singleton";

import { Creator } from "../../typings/Creator";
import { findRepository } from "../../functional/findRepository";

import { BelongsOneToOne } from "./BelongsOneToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { RelationshipVariable } from "../base/RelationshipVariable";
import { get_primary_field } from "../base/get_primary_field";

/**
 * Type for a variable using the `Has.OneToOne` decorator.
 * 
 * @template Target Type of the target model class who belongs to this model class *Mine* as 1: 1
 * @template Ensure Whether existence of the 1:1 owned record can be assured.
 */
export type HasOneToOne<Target extends object, Ensure extends boolean = false>
    = HasOneToOne.Accessor<Target, Ensure extends true ? Target : Target | null>;

export function HasOneToOne<
        Mine extends object, 
        Target extends object,
        Ensure extends boolean = false>
    (
        targetGen: Creator.Generator<Target>,
        inverse: (input: Target) =>  BelongsOneToOne<Mine, any>,
        ensure: Ensure = false as Ensure
    ): PropertyDecorator
{
    return function ($class, $property)
    {
        // LIST UP PROPERTIES
        const inverse_property: string = ClosureProxy.steal(inverse);
        const label: string = RelationshipVariable.helper("has", $property as string);
        const getter: string = RelationshipVariable.getter("has", $property as string);
        const primary_field = new Singleton(() => get_primary_field($class.constructor as any));
        const inverse_getter: string = RelationshipVariable.getter("belongs", inverse_property);

        // DECORATOR FUNCTION
        orm.OneToOne(targetGen, inverse_getter, { lazy: true })($class, getter);

        // METADATA
        const metadata: HasOneToOne.IMetadata<Target> = {
            type: "Has.OneToOne",
            target: targetGen,
            inverse: inverse_property,

            property: $property as string,
            primary_field,
            getter,
            inverse_getter,

            ensure
        };
        ReflectAdaptor.set($class, $property, metadata);

        // ACCESSOR
        Object.defineProperty($class, $property, 
        {
            get: function (): HasOneToOne.Accessor<Target, Ensure extends true ? Target : Target | null>
            {
                if (this[label] === undefined)
                    this[label] = HasOneToOne.Accessor.create(metadata, this);
                return this[label];
            }
        });
    }
}

export namespace HasOneToOne
{
    /**
     * @internal
     */
    export interface IMetadata<T extends object>
    {
        type: "Has.OneToOne";
        target: () => Creator<T>;
        inverse: string;

        property: string;
        primary_field: Singleton<string>;
        getter: string;
        inverse_getter: string;

        ensure: boolean;
    }

    export class Accessor<Target extends object, Output extends Target | null>
    {
        private singleton_: MutableSingleton<Output>;

        private constructor
            (
                private readonly metadata_: IMetadata<Target>,
                private readonly mine_: any,
            )
        {
            this.singleton_ = new MutableSingleton(() => this.get());
        }

        /**
         * @internal
         */
        public static create<Target extends object, Output extends Target | null>
            (
                metadata: IMetadata<Target>,
                mine: any,
            ): Accessor<Target, Output>
        {
            return new Accessor(metadata, mine);
        }

        public statement(): orm.QueryBuilder<Target>
        {
            const creator: Creator<Target> = this.metadata_.target();

            return findRepository(creator)
                .createQueryBuilder(creator.name)
                .andWhere(`${creator.name}.${this.metadata_.inverse_getter} = :fid`, { 
                    fid: this.mine_[this.metadata_.primary_field.get()] 
                });
        }

        public async set(obj: Output): Promise<void>
        {
            if (obj === null && this.metadata_.ensure === true)
                throw new DomainError(this.get_null_error_message("set()"));
                
            await this.singleton_.set(obj);
            this.mine_[`__${this.metadata_.getter}__`] = obj;
            this.mine_[`__has_${this.metadata_.getter}__`] = true;
        }

        public async reload(): Promise<Output>
        {
            const output: Output = await this.singleton_.reload();
            this.mine_[`__${this.metadata_.getter}__`] = output;

            return output;
        }

        public get(): Promise<Output>
        {
            return this._Get();
        }

        private async _Get(): Promise<Output>
        {
            const output: Output = await this.mine_[this.metadata_.getter];
            if (output === null && this.metadata_.ensure === true)
                throw new DomainError(this.get_null_error_message("get()"));
            return output;
        }

        private get_null_error_message(symbol: string): string
        {
            return `Error on ${this.mine_.constructor.name}.${this.metadata_.property}.${symbol}: must not be null`;
        }
    }
}