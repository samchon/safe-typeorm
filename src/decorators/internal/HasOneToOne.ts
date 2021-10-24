import * as orm from "typeorm";
import { DomainError } from "tstl/exception/DomainError";
import { SharedLock } from "tstl/thread/SharedLock";
import { SharedMutex } from "tstl/thread/SharedMutex";
import { Singleton } from "tstl/thread/Singleton";
import { UniqueLock } from "tstl/thread/UniqueLock";

import { Creator } from "../../typings/Creator";
import { findRepository } from "../../functional/findRepository";

import { BelongsOneToOne } from "./BelongsOneToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { ColumnAccessor } from "../base/ColumnAccessor";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
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
        const inverseField: string = ClosureProxy.steal(inverse);
        const metadata: HasOneToOne.IMetadata<Target> = {
            type: "Has.OneToOne",
            target: targetGen,
            inverse: inverseField,
            ensure
        };
        ReflectAdaptor.set($class, $property, metadata);

        const label: string = ColumnAccessor.helper("has", $property as string);
        const getter: string = ColumnAccessor.getter("has", $property as string);
        const primaryField = new Singleton(() => get_primary_field("Has.OneToOne", $class as any));
        const inverseGetter: string = ColumnAccessor.getter("belongs", inverseField);

        orm.OneToOne(targetGen, inverseGetter, { lazy: true })($class, getter);

        Object.defineProperty($class, $property, 
        {
            get: function (): HasOneToOne.Accessor<Target, Ensure extends true ? Target : Target | null>
            {
                if (this[label] === undefined)
                    this[label] = HasOneToOne.Accessor.create
                    (
                        this, 
                        $property as string,
                        primaryField,
                        getter,
                        targetGen(),
                        inverseField,
                        ensure
                    );
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
        ensure: boolean;
    }

    export class Accessor<Target extends object, Output extends Target | null>
    {
        private readonly mutex_: SharedMutex;

        private constructor
            (
                private readonly mine_: any, 
                private readonly property_: string,
                private readonly primary_field_: Singleton<string>,
                private readonly getter_: string,
                private readonly target_: Creator<Target>, 
                private readonly inverse_field_: string,
                private readonly ensure_: boolean
            )
        {
            this.mutex_ = new SharedMutex();
        }

        /**
         * @internal
         */
        public static create<Target extends object, Output extends Target | null>
            (
                mine: any, 
                property: string,
                primaryField: Singleton<string>,
                getter: string,
                target: Creator<Target>, 
                inverseField: string,
                ensure: boolean
            ): Accessor<Target, Output>
        {
            return new Accessor(mine, property, primaryField, getter, target, inverseField, ensure);
        }

        public async get(): Promise<Output>
        {
            let output: Output;
            await SharedLock.lock(this.mutex_, async () =>
            {
                output = await this.mine_[this.getter_];
                if (output === null && this.ensure_ === true)
                    throw new DomainError(`Error on ${this.mine_.constructor.name}.${this.property_}.get(): you've ensured that it can't be null, but it was not.`);
            });
            return output!;
        }

        public async set(obj: Output): Promise<void>
        {
            if (obj === null && this.ensure_ === true)
                throw new DomainError(`Error on ${this.mine_.constructor.name}.${this.property_}.set(): must not be null.`);
                
            await UniqueLock.lock(this.mutex_, () =>
            {
                this.mine_[this.getter_] = Promise.resolve(obj);
            });
        }

        public statement(): orm.QueryBuilder<Target>
        {
            return findRepository(this.target_)
                .createQueryBuilder(this.target_.name)
                .andWhere(`${this.target_.name}.${this.inverse_field_} = :id`, { 
                    id: this.mine_[this.primary_field_.get()] 
                });
        }
    }
}