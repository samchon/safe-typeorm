import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { Singleton } from "tstl/thread/Singleton";

import { Comparator } from "../../typings/Comparator";
import { Creator } from "../../typings/Creator";
import { findRepository } from "../../functional/findRepository";
import { getColumn } from "../../functional/getColumn";

import { BelongsExternalManyToOne } from "./BelongsExternalManyToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { RelationshipVariable } from "../base/RelationshipVariable";
import { get_primary_field } from "../base/get_primary_field";

export type HasExternalOneToMany<Target extends object> 
    = HasExternalOneToMany.Accessor<Target>;

export function HasExternalOneToMany<Mine extends object, Target extends object>
    (
        target: Creator.Generator<Target>,
        inverse: (input: Target) => BelongsExternalManyToOne<Mine, any>,
        comparator?: Comparator<Target>
    ): PropertyDecorator
{
    return function ($class, $property)
    {
        // LIST UP PROPERTIES
        const label: string = RelationshipVariable.helper("has", $property as string);
        const inverse_property: string = ClosureProxy.steal(inverse);
        const foreign_key_field = new Singleton(() => getColumn(target(), `.${inverse_property as any}`, null));
        const primary_field = new Singleton(() => get_primary_field($class.constructor as any));

        // METADATA
        const metadata: HasExternalOneToMany.IMetadata<Target> = {
            type: "Has.External.OneToMany",
            target,
            inverse: inverse_property,

            property: $property as string,
            primary_field,
            foreign_key_field,

            comparator
        };
        ReflectAdaptor.set($class, $property, metadata);

        // ACCESSOR
        Object.defineProperty($class, $property,
        {
            get: function ()
            {
                if (this[label] === undefined)
                    this[label] = HasExternalOneToMany.Accessor.create(metadata, this);
                return this[label];
            }
        });
    };
}

export namespace HasExternalOneToMany
{
    /**
     * @internal
     */
    export interface IMetadata<T extends object>
    {
        type: "Has.External.OneToMany";
        target: () => Creator<T>;
        inverse: string;

        property: string;
        primary_field: Singleton<string>;
        foreign_key_field: Singleton<string>;

        comparator: Comparator<T> | undefined;
    }

    export class Accessor<Target extends object>
    {
        private readonly singleton_: MutableSingleton<Target[]>;

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
        public static create<Target extends object>
            (
                metadata: IMetadata<Target>,
                mine: any, 
            ): Accessor<Target>
        {
            return new Accessor(metadata, mine);
        }

        public async set(objs: Target[]): Promise<void>
        {
            if (this.metadata_.comparator)
                objs = objs.sort(this.metadata_.comparator);
            await this.singleton_.set(objs);
        }

        public async get(): Promise<Target[]>
        {
            return this.singleton_.get();
        }

        private async _Get(): Promise<Target[]>
        {
            const primary: string = this.metadata_.primary_field.get();
            const foreign: string = this.metadata_.foreign_key_field.get();

            const data: Target[] = await 
                findRepository(this.metadata_.target())
                .find({ [foreign]: this.mine_[primary] });

            for (const elem of data)
                await (elem as any)[this.metadata_.inverse].set(this.mine_);

            return this.metadata_.comparator
                ? data.sort(this.metadata_.comparator)
                : data;
        }
    }
}