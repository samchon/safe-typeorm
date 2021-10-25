import { DomainError } from "tstl/exception/DomainError";
import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { Singleton } from "tstl/thread/Singleton";

import { Creator } from "../../typings/Creator";
import { findRepository } from "../../functional/findRepository";
import { getColumn } from "../../functional/getColumn";

import { BelongsExternalOneToOne } from "./BelongsExternalOneToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { RelationshipVariable } from "../base/RelationshipVariable";
import { get_primary_field } from "../base/get_primary_field";

export type HasExternalOneToOne<Target extends object, Ensure extends boolean = false>
    = HasExternalOneToOne.Accessor<Target, Ensure extends true ? Target : Target | null>;

export function HasExternalOneToOne<
        Mine extends object, 
        Target extends object,
        Ensure extends boolean = false>
    (
        target: Creator.Generator<Target>,
        inverse: (input: Target) => BelongsExternalOneToOne<Mine, any>,
        ensure: Ensure = false as Ensure
    ): PropertyDecorator
{
    return function ($class, $property)
    {
        // LIST UP PROPERTIES
        const label: string = RelationshipVariable.helper("has", $property as string);
        const inverse_property: string = ClosureProxy.steal(inverse);
        const foreign_key_field = new Singleton(() => getColumn(target(), `.${inverse_property as any}`));
        const primary_field = new Singleton(() => get_primary_field($class.constructor as any));

        // METADATA
        const metadata: HasExternalOneToOne.IMetadata<Target> = {
            type: "Has.External.OneToOne",
            target,
            inverse: inverse_property,

            property: $property as string,
            primary_field,
            foreign_key_field,

            ensure
        };
        ReflectAdaptor.set($class, $property, metadata);

        // ACCESSOR
        Object.defineProperty($class, $property,
        {
            get: function ()
            {
                if (this[label] === undefined)
                    this[label] = HasExternalOneToOne.Accessor.create(metadata, this);
                return this[label];
            }
        });
    };
}

export namespace HasExternalOneToOne
{
    /**
     * @internal
     */
    export interface IMetadata<T extends object>
    {
        type: "Has.External.OneToOne";
        target: () => Creator<T>;
        inverse: string;

        property: string;
        primary_field: Singleton<string>;
        foreign_key_field: Singleton<string>;

        ensure: boolean;
    }

    export class Accessor<Target extends object, Output extends Target | null>
    {
        private readonly singleton_: MutableSingleton<Output>;

        private constructor
            (
                private readonly metadata_: IMetadata<Target>,
                private readonly mine_: any,
            )
        {
            this.singleton_ = new MutableSingleton(() => this._Get());
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

        public async set(obj: Output): Promise<void>
        {
            if (obj === null && this.metadata_.ensure === true)
                throw new DomainError(this.get_null_error_message("set()"));
            await this.singleton_.set(obj);
        }

        public get(): Promise<Output>
        {
            return this.singleton_.get();
        }

        private async _Get(): Promise<Output>
        {
            const pk: string = this.metadata_.primary_field.get();
            const output: Target | undefined =  await 
                findRepository(this.metadata_.target())
                .findOne({ [this.metadata_.foreign_key_field.get()]: this.mine_[pk] });
            
            if (output !== undefined)
                await (output as any)[this.metadata_.inverse].set(this.mine_);
            else if (this.metadata_.ensure === true)
                throw new DomainError(this.get_null_error_message("get()"));

            return (output || null) as Output;
        }

        private get_null_error_message(symbol: string): string
        {
            return `Error on ${this.mine_.constructor.name}.${this.metadata_.property}.${symbol}: must not be null`;
        }
    }
}