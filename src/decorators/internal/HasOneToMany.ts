import * as orm from "typeorm";
import { Singleton } from "tstl/thread/Singleton";

import { Comparator } from "../../typings/Comparator";
import { Creator } from "../../typings/Creator";
import { findRepository } from "../../functional/findRepository";

import { BelongsManyToOne } from "./BelongsManyToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { RelationshipVariable } from "../base/RelationshipVariable";
import { get_primary_field } from "../base/get_primary_field";
import { MutableSingleton } from "tstl/thread/MutableSingleton";

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
        // LIST UP PROPERTIES
        const inverse_property: string = ClosureProxy.steal(inverse);
        const label: string = RelationshipVariable.helper("has", $property as string);
        const primary_field = new Singleton(() => get_primary_field($class.constructor as any));
        
        const getter: string = RelationshipVariable.getter("has", $property as string);
        const inverse_getter: string = RelationshipVariable.getter("belongs", inverse_property);
        
        // DECORATOR FUNCTION
        orm.OneToMany(targetGen, inverse_getter, { lazy: true })($class, getter);

        // METADATA
        const metadata: HasOneToMany.IMetadata<Target> = {
            type: "Has.OneToMany",
            target: targetGen,
            inverse: inverse_property,

            primary_field,
            getter,
            inverse_getter,

            comparator
        };
        ReflectAdaptor.set($class, $property, metadata);

        // ACCESSOR
        Object.defineProperty($class, $property, 
        {
            get: function (): HasOneToMany.Accessor<Target>
            {
                if (this[label] === undefined)
                    this[label] = HasOneToMany.Accessor.create(metadata, this);
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

        primary_field: Singleton<string>;
        getter: string;
        inverse_getter: string;

        comparator: Comparator<Target> | undefined;
    }

    export class Accessor<Target extends object>
    {
        private singleton_: MutableSingleton<Target[]>;

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

        public statement(): orm.QueryBuilder<Target>
        {
            const creator: Creator<Target> = this.metadata_.target();

            return findRepository(creator)
                .createQueryBuilder(creator.name)
                .andWhere(`${creator.name}.${this.metadata_.inverse_getter} = :fid`, { 
                    fid: this.mine_[this.metadata_.primary_field.get()] 
                });
        }

        public async set(objs: Target[]): Promise<void>
        {
            await this.singleton_.set(objs);
            this.mine_[`__${this.metadata_.getter}__`] = objs;
            this.mine_[`__has_${this.metadata_.getter}__`] = true;
        }

        public async reload(): Promise<Target[]>
        {
            const output: Target[] = await this.singleton_.reload();
            this.mine_[`__${this.metadata_.getter}__`] = output;

            return output;
        }

        public get(): Promise<Target[]>
        {
            return this.singleton_.get();
        }

        private async _Get(): Promise<Target[]>
        {
            const output: Target[] = await this.mine_[this.metadata_.getter];
            for (const elem of output)
                await (elem as any)[this.metadata_.inverse].set(this.mine_);
            return this.metadata_.comparator
                ? output.sort(this.metadata_.comparator)
                : output;
        }
    }
}