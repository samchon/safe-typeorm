import * as orm from "typeorm";
import { SharedLock } from "tstl/thread/SharedLock";
import { SharedMutex } from "tstl/thread/SharedMutex";
import { UniqueLock } from "tstl/thread/UniqueLock";

import { Comparator } from "../../typings/Comparator";
import { Creator } from "../../typings/Creator";

import { BelongsManyToOne } from "./BelongsManyToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { ColumnAccessor } from "../base/ColumnAccessor";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { get_primary_field } from "../base/get_primary_field";

export type HasOneToMany<Target extends object> = HasOneToMany.Accessor<Target>;
export function HasOneToMany<Mine extends object, Target extends object>
    (
        targetGen: Creator.Generator<Target>,
        inverse: (input: Target) => BelongsManyToOne<Mine, any>,
        comparator?: Comparator<Target>
    ): PropertyDecorator
{
    return function ($class, $property)
    {
        const inverseField: string = ClosureProxy.steal(inverse);
        const metadata: HasOneToMany.IMetadata<Target> = {
            type: "Has.OneToMany",
            target: targetGen,
            inverse: inverseField,
            comparator
        };
        ReflectAdaptor.set($class, $property, metadata);

        const label: string = ColumnAccessor.helper("has", $property as string);
        const getter: string = ColumnAccessor.getter("has", $property as string);
        const inverseGetter: string = ColumnAccessor.getter("belongs", inverseField);

        orm.OneToMany(targetGen, inverseGetter, { lazy: true })($class, getter);

        Object.defineProperty($class, $property, 
        {
            get: function (): HasOneToMany.Accessor<Target>
            {
                if (this[label] === undefined)
                    this[label] = HasOneToMany.Accessor.create
                    (
                        this, 
                        get_primary_field("Has.OneToMany", targetGen()),
                        targetGen(),
                        getter,
                        inverseField,
                        comparator
                    );
                return this[label];
            }
        });
    }
}

export namespace HasOneToMany
{
    /**
     * @internal
     */
    export interface IMetadata<Target extends object>
    {
        type: "Has.OneToMany";
        target: () => Creator<Target>;
        inverse: string;
        comparator: Comparator<Target> | undefined;
    }

    export class Accessor<Target extends object>
    {
        private readonly stmt_: orm.QueryBuilder<Target>;
        private readonly mutex_: SharedMutex;
        private sorted_?: boolean;

        private constructor
            (
                private readonly mine_: any, 
                targetPrimaryField: string,
                target: Creator<Target>, 
                private readonly getter_: string,
                inverseField: string,
                private readonly comp_: Comparator<Target> | undefined,
            )
        {
            this.stmt_ = orm.getRepository(target)
                .createQueryBuilder(target.name)
                .andWhere(`${target.name}.${inverseField} = :id`, { id: this.mine_[targetPrimaryField] });
            this.mutex_ = new SharedMutex();

            if (this.comp_ !== undefined)
                this.sorted_ = false;
        }

        /**
         * @internal
         */
        public static create<Target extends object>
            (
                mine: any, 
                primaryField: string,
                target: Creator<Target>, 
                getter: string,
                inverseField: string,
                comp: Comparator<Target> | undefined,
            ): Accessor<Target>
        {
            return new Accessor(mine, primaryField, target, getter, inverseField, comp);
        }

        public async get(): Promise<Target[]>
        {
            let output: Target[];
            await SharedLock.lock(this.mutex_, async () =>
            {
                output = await this.mine_[this.getter_];
                if (this.comp_ !== undefined && this.sorted_ === false)
                {
                    output = output.sort(this.comp_);
                    this.sorted_ = true;
                }
            });
            return output!;
        }

        public async set(target: Target[]): Promise<void>
        {
            await UniqueLock.lock(this.mutex_, () =>
            {
                this.mine_[this.getter_] = Promise.resolve(target);
                this.sorted_ = true;
            });
        }

        public statement(): orm.QueryBuilder<Target>
        {
            return this.stmt_.clone();
        }
    }
}