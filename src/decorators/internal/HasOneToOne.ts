import * as orm from "typeorm";
import { DomainError } from "tstl/exception/DomainError";
import { SharedLock } from "tstl/thread/SharedLock";
import { SharedMutex } from "tstl/thread/SharedMutex";
import { UniqueLock } from "tstl/thread/UniqueLock";

import { Creator } from "../../typings/Creator";

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
                        get_primary_field("Has.OneToOne", targetGen()),
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
        private readonly stmt_: orm.QueryBuilder<Target>;
        private readonly mutex_: SharedMutex;

        private constructor
            (
                private readonly mine_: any, 
                private readonly property_: string,
                primaryField: string,
                private readonly getter_: string,
                target: Creator<Target>, 
                inverseField: string,
                private readonly ensure_: boolean
            )
        {
            this.stmt_ = orm.getRepository(target)
                .createQueryBuilder(target.name)
                .andWhere(`${target.name}.${inverseField} = :id`, { id: this.mine_[primaryField] });
            this.mutex_ = new SharedMutex();
        }

        /**
         * @internal
         */
        public static create<Target extends object, Output extends Target | null>
            (
                mine: any, 
                property: string,
                primaryField: string,
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
            return this.stmt_.clone();
        }
    }
}