import * as orm from "typeorm";
import { DomainError } from "tstl/exception/DomainError";
import { MutableSingleton } from "tstl/thread/MutableSingleton";

import { Creator } from "../../typings/Creator";

import { BelongsExternalOneToOne } from "./BelongsExternalOneToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { get_primary_field } from "../base/get_primary_field";

export type HasExternalOneToOne<Target extends object, Ensure extends boolean = false>
    = HasExternalOneToOne.Accessor<Target, Ensure extends true ? Target : Target | null>;

export function HasExternalOneToOne<
        Mine extends object, 
        Target extends object,
        Ensure extends boolean = false>
    (
        targetGen: Creator.Generator<Target>,
        inverse: (input: Target) => BelongsExternalOneToOne<Mine, any>,
        ensure: Ensure = false as Ensure
    ): PropertyDecorator
{
    return function ($class, $property)
    {
        const label: string = HasExternalOneToOne.getHelperField($property as string);
        const primaryField: string = get_primary_field("Has.External.OneToOne", $class as any);
        const inverseField: string = ClosureProxy.steal(inverse);

        Object.defineProperty($class, $property,
        {
            get: function ()
            {
                if (this[label] === undefined)
                    this[label] = HasExternalOneToOne.Accessor.create
                    (
                        this, 
                        $property as string,
                        primaryField, 
                        targetGen(), 
                        inverseField,
                        ensure
                    );
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
        ensure: boolean;
    }

    export class Accessor<Target extends object, Output extends Target | null>
    {
        private readonly singleton_: MutableSingleton<Output>;

        private constructor
            (
                private readonly mine_: any,
                private readonly property_: string,
                private readonly primary_field_: string,
                private readonly target_: Creator<Target>,
                private readonly inverse_field_: string,
                private readonly ensure_: boolean
            )
        {
            this.singleton_ = new MutableSingleton(async () => 
            {
                const output: Target | undefined =  await orm
                    .getRepository(this.target_)
                    .findOne({ [this.inverse_field_]: this.mine_[this.primary_field_] });
                if (output !== undefined)
                    await (output as any)[this.inverse_field_].set(this.mine_);
                else if (this.ensure_ === true)
                throw new DomainError(`Error on ${this.mine_.constructor.name}.${this.property_}.get(): you've ensured that it can't be null, but it was not.`);

                return (output || null) as Output;
            });
        }

        /**
         * @internal
         */
        public static create<Target extends object, Output extends Target | null>
            (
                mine: any,
                property: string,
                primary_field: string,
                target: Creator<Target>,
                inverse_field: string,
                ensure: boolean
            ): Accessor<Target, Output>
        {
            return new Accessor(mine, property, primary_field, target, inverse_field, ensure);
        }

        public get(): Promise<Output>
        {
            return this.singleton_.get();
        }

        public set(obj: Output): Promise<void>
        {
            return this.singleton_.set(obj);
        }
    }

    /**
     * @internal
     */
    export function getGetterField(field: string): string
    {
        return `__m_has_external_one_to_one_${field}_getter__`;
    }
    
    /**
     * @internal
     */
    export function getHelperField(field: string): string
    {
        return `__m_has_external_one_to_one_${field}_helper__`;
    }
}