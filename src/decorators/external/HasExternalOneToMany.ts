import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { Singleton } from "tstl/thread/Singleton";

import { Comparator } from "../../typings/Comparator";
import { Creator } from "../../typings/Creator";
import { findRepository } from "../../functional/findRepository";

import { BelongsExternalManyToOne } from "./BelongsExternalManyToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { ColumnAccessor } from "../base/ColumnAccessor";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { get_primary_field } from "../base/get_primary_field";

export type HasExternalOneToMany<Target extends object> 
    = HasExternalOneToMany.Accessor<Target>;

export function HasExternalOneToMany<Mine extends object, Target extends object>
    (
        targetGen: Creator.Generator<Target>,
        inverse: (input: Target) => BelongsExternalManyToOne<Mine, any>,
        comparator?: Comparator<Target>
    ): PropertyDecorator
{
    return function ($class, $property)
    {
        const label: string = ColumnAccessor.helper("has", $property as string);
        const inverseField: string = ClosureProxy.steal(inverse);
        const primaryField = new Singleton(() => get_primary_field("Has.External.OneToMany", $class as any));

        const metadata: HasExternalOneToMany.IMetadata<Target> = {
            type: "Has.External.OneToMany",
            target: targetGen,
            inverse: inverseField,
            comparator
        };
        ReflectAdaptor.set($class, $property, metadata);

        Object.defineProperty($class, $property,
        {
            get: function ()
            {
                if (this[label] === undefined)
                    this[label] = HasExternalOneToMany.Accessor.create
                    (
                        this, 
                        primaryField, 
                        targetGen(), 
                        inverseField,
                        comparator
                    );
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
        comparator: Comparator<T> | undefined;
    }

    export class Accessor<Target extends object>
    {
        private readonly singleton_: MutableSingleton<Target[]>;

        private constructor
            (
                private readonly mine_: any,
                private readonly primary_field_: Singleton<string>,
                private readonly target_: Creator<Target>,
                private readonly inverse_field_: string,
                private readonly comp_: Comparator<Target> | undefined
            )
        {
            this.singleton_ = new MutableSingleton(async () => 
            {
                const pk:  string = this.primary_field_.get();
                const data: Target[] = await findRepository(this.target_).find({ [this.inverse_field_]: this.mine_[pk] });

                for (const elem of data)
                    await (elem as any)[this.inverse_field_].set(this.mine_);

                return this.comp_
                    ? data.sort(this.comp_)
                    : data;
            });
        }

        /**
         * @internal
         */
        public static create<Target extends object>
            (
                mine: any, 
                primaryField: Singleton<string>,
                target: Creator<Target>, 
                inverseField: string,
                comp: Comparator<Target> | undefined,
            ): Accessor<Target>
        {
            return new Accessor(mine, primaryField, target, inverseField, comp);
        }

        public async get(): Promise<Target[]>
        {
            return this.singleton_.get();
        }

        public async set(objs: Target[]): Promise<void>
        {
            if (this.comp_)
                objs = objs.sort(this.comp_);
            await this.singleton_.set(objs);
        }
    }
}