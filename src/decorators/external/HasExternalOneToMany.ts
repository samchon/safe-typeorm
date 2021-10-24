import * as orm from "typeorm";
import { MutableSingleton } from "tstl/thread/MutableSingleton";

import { Comparator } from "../../typings/Comparator";
import { Creator } from "../../typings/Creator";

import { BelongsExternalManyToOne } from "./BelongsExternalManyToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { get_primary_field } from "../base/get_primary_field";

export type HasExternalOneToMany<Target extends object> 
    = HasExternalOneToMany.Accessor<Target>;

export function OneToMany<Mine extends object, Target extends object>
    (
        targetGen: Creator.Generator<Target>,
        inverse: (input: Target) => BelongsExternalManyToOne<Mine, any>,
        comp?: Comparator<Target>
    ): PropertyDecorator
{
    return function ($class, $property)
    {
        const label: string = HasExternalOneToMany.getHelperField($property as string);
        const primaryField: string = get_primary_field("Has.External.OneToMany", $class as any);
        const inverseField: string = ClosureProxy.steal(inverse);

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
                        comp
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
                private readonly primary_field_: string,
                private readonly target_: Creator<Target>,
                private readonly inverse_field_: string,
                private readonly comp_: Comparator<Target> | undefined
            )
        {
            this.singleton_ = new MutableSingleton(async () => 
            {
                const data: Target[] = await orm
                    .getRepository(this.target_)
                    .find({ [this.inverse_field_]: this.mine_[this.primary_field_] });
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
                primaryField: string,
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

    /**
     * @internal
     */
    export function getGetterField(field: string): string
    {
        return `__m_has_external_one_to_many_${field}_getter__`;
    }
    
    /**
     * @internal
     */
    export function getHelperField(field: string): string
    {
        return `__m_has_external_one_to_many_${field}_helper__`;
    }
}