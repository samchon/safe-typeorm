import { MutableSingleton } from "tstl/thread/MutableSingleton";
import { Singleton } from "tstl/thread/Singleton";
import * as orm from "typeorm";

import { findRepository } from "../../functional/findRepository";

import { Comparator } from "../../typings/Comparator";
import { Creator } from "../../typings/Creator";

import { ArrayUtil } from "../../utils/ArrayUtil";
import { ClosureProxy } from "../base/ClosureProxy";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { RelationshipVariable } from "../base/RelationshipVariable";
import { get_primary_field } from "../base/get_primary_field";
import { BelongsManyToOne } from "./BelongsManyToOne";
import { BelongsOneToOne } from "./BelongsOneToOne";

/**
 * Type for a variable using the `Has.ManyToMany` decorator.
 *
 * @template Target Type of the target model, who has the N: N relationship with this model
 *                  class *Mine*, through the *Route* model class
 * @tempalte Router Type of the router model, who intermediates the M: N relationship.
 */
export type HasManyToMany<
    Target extends object,
    Router extends object,
> = HasManyToMany.Accessor<Target, Router>;

/**
 * Decorator function for the "N:N has" relationship.
 *
 * @template Mine Type of this model class who is using it, the `Has.ManyToMany` decorator
 * @template Target Type of the target model class, who has the N: N relationship with this
 *                  model class *Mine*, through the *Route* model class
 * @template Router Type of the router model who intermediates those *Mine* and *Route* model
 *                  classes to resolve the N: N relationship
 * @param target A closure function returning the *Target* model class, who has the N: N
 *                  relationship with this model class *Mine* through the *Route* model class
 * @param router A closure function returning the *Router* model class, who intermediates
 *                  those *Mine* and *Route* model classes to resolve the N: N relationship
 * @param targetInverse A closure function returning the {@link Belongs.ManyToOne} typed member
 *                      variable, who is pointing this model class *Mine*, from the *Route*
 *                      model class
 * @param myInverse A closure function returning the {@link Belongs.ManyToOne} typed member
 *                  variable, who is poining the target model class *Target*, from the *Rote*
 *                  mode class
 * @param comparator Comparator for sorting if required.
 * @return The *PropertyDecorator* function
 */
export function HasManyToMany<
    Mine extends object,
    Target extends object,
    Router extends object,
>(
    target: Creator.Generator<Target>,
    router: Creator.Generator<Router>,
    targetInverse: (
        router: Router,
    ) => BelongsManyToOne<Target, any> | BelongsOneToOne<Target, any>,
    myInverse: (
        router: Router,
    ) => BelongsManyToOne<Mine, any> | BelongsOneToOne<Target, any>,
    comparator?: Comparator<HasManyToMany.ITuple<Target, Router>>,
): PropertyDecorator {
    return function ($class, $property) {
        const label: string = RelationshipVariable.helper(
            "has",
            $property as string,
        );
        const target_inverse: string = ClosureProxy.steal(targetInverse);
        const my_inverse: string = ClosureProxy.steal(myInverse);

        const metadata: HasManyToMany.IMetadata<Target, Router> = {
            type: "Has.ManyToMany",
            target,
            router,
            target_inverse,
            my_inverse,

            my_primary_field: new Singleton(() =>
                get_primary_field($class.constructor as any),
            ),
            target_primary_field: new Singleton(() =>
                get_primary_field(target()),
            ),
            router_to_my_field: new Singleton(
                () =>
                    (
                        ReflectAdaptor.get(
                            router().prototype,
                            my_inverse,
                        ) as BelongsManyToOne.IMetadata<Mine>
                    ).foreign_key_field,
            ),
            router_to_target_field: new Singleton(
                () =>
                    (
                        ReflectAdaptor.get(
                            router().prototype,
                            target_inverse,
                        ) as BelongsManyToOne.IMetadata<Target>
                    ).foreign_key_field,
            ),

            comparator,
        };
        ReflectAdaptor.set($class, $property, metadata as any);

        Object.defineProperty($class, $property, {
            get: function (): HasManyToMany.Accessor<Target, Router> {
                if (this[label] === undefined)
                    this[label] = HasManyToMany.Accessor.create(metadata, this);
                return this[label];
            },
        });
    };
}

export namespace HasManyToMany {
    /**
     * @internal
     */
    export interface IMetadata<Target extends object, Router extends object> {
        type: "Has.ManyToMany";
        target: () => Creator<Target>;
        router: () => Creator<Router>;
        target_inverse: string;
        my_inverse: string;

        my_primary_field: Singleton<string>;
        target_primary_field: Singleton<string>;
        router_to_target_field: Singleton<string>;
        router_to_my_field: Singleton<string>;

        comparator: Comparator<ITuple<Target, Router>> | undefined;
    }

    export interface ITuple<Target extends object, Router extends object> {
        target: Target;
        router: Router;
    }

    export class Accessor<Target extends object, Router extends object> {
        private readonly data_: MutableSingleton<Target[]>;

        private constructor(
            private readonly metadata_: IMetadata<Target, Router>,
            private readonly mine_: any,
        ) {
            this.data_ = new MutableSingleton(() => this._Get());
        }

        /**
         * @internal
         */
        public static create<Target extends object, Router extends object>(
            metadata: IMetadata<Target, Router>,
            mine: any,
        ): Accessor<Target, Router> {
            return new Accessor<Target, Router>(metadata, mine);
        }

        public get(): Promise<Target[]> {
            return this.data_.get();
        }

        public set(value: Target[]): Promise<void> {
            return this.data_.set(value);
        }

        public statement(
            joinAndSelect: boolean = false,
        ): orm.SelectQueryBuilder<Router> {
            const router: Creator<Router> = this.metadata_.router();
            const target: Creator<Target> = this.metadata_.target();
            const joinArguments = [
                target,
                target.name,
                `${
                    target.name
                }.${this.metadata_.target_primary_field.get()} = ${
                    router.name
                }.${this.metadata_.router_to_target_field.get()}`,
            ] as const;

            const stmt = findRepository(router)
                .createQueryBuilder(router.name)
                .andWhere(
                    `${
                        router.name
                    }.${this.metadata_.router_to_my_field.get()} = :my_id`,
                    {
                        my_id: this.mine_[
                            this.metadata_.my_primary_field.get()
                        ],
                    },
                );
            if (joinAndSelect === true)
                stmt.innerJoinAndSelect(...joinArguments);
            else stmt.innerJoin(...joinArguments);
            return stmt;
        }

        private async _Get(): Promise<Target[]> {
            const routerList: Router[] = await this.statement(true).getMany();
            const tuples: ITuple<Target, Router>[] = await ArrayUtil.asyncMap(
                routerList,
                async (router) => ({
                    router,
                    target: await (router as any)[
                        this.metadata_.target_inverse
                    ].get(),
                }),
            );
            if (this.metadata_.comparator)
                tuples.sort(this.metadata_.comparator);
            return tuples.map(({ target }) => target);
        }
    }
}
