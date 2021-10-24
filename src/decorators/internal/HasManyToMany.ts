import * as orm from "typeorm";
import { MutableSingleton } from "tstl/thread/MutableSingleton";

import { Comparator } from "../../typings/Comparator";
import { Creator } from "../../typings/Creator";

import { BelongsManyToOne } from "./BelongsManyToOne";
import { ClosureProxy } from "../base/ClosureProxy";
import { ReflectAdaptor } from "../base/ReflectAdaptor";
import { get_primary_field } from "../base/get_primary_field";
import { ColumnAccessor } from "../base/ColumnAccessor";

/**
 * Type for a variable using the `Has.ManyToMany` decorator.
 * 
 * @template Target Type of the target model, who has the N: N relationship with this model 
 *                  class *Mine*, through the *Route* model class
 * @tempalte Router Type of the router model, who intermediates the M: N relationship.
 */
export type HasManyToMany<Target extends object, Router extends object> 
    = HasManyToMany.Accessor<Target, Router>;

/**
 * Decorator function for the "N:N has" relationship.
 * 
 * @template Mine Type of this model class who is using it, the `Has.ManyToMany` decorator
 * @template Target Type of the target model class, who has the N: N relationship with this 
 *                  model class *Mine*, through the *Route* model class
 * @template Router Type of the router model who intermediates those *Mine* and *Route* model 
 *                  classes to resolve the N: N relationship
 * @param targetGen A closure function returning the *Target* model class, who has the N: N
 *                  relationship with this model class *Mine* through the *Route* model class
 * @param routerGen A closure function returning the *Router* model class, who intermediates
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
        Router extends object>
    (
        targetGen: Creator.Generator<Target>,
        routerGen: Creator.Generator<Router>,
        targetInverse: (router: Router) => BelongsManyToOne<Target, any>,
        myInverse: (router: Router) => BelongsManyToOne<Mine, any>,
        comparator?: Comparator<HasManyToMany.ITuple<Target, Router>>
    ): PropertyDecorator
{
    return function ($class, $property)
    {
        const label: string = ColumnAccessor.helper("has", $property as string);
        const metadata: HasManyToMany.IMetadata<Target, Router> = {
            type: "Has.ManyToMany",
            target: targetGen,
            router: routerGen,
            target_inverse: ClosureProxy.steal(targetInverse),
            my_inverse: ClosureProxy.steal(myInverse),
            comparator
        };
        ReflectAdaptor.set($class, $property, metadata as any);

        Object.defineProperty($class, $property,
        {
            get: function (): HasManyToMany.Accessor<Target, Router>
            {
                if (this[label] === undefined)
                {
                    const router: Creator<Router> = routerGen();
                    this[label] = HasManyToMany.Accessor.create
                    (
                        this, 
                        targetGen(), 
                        router, 
                        metadata.target_inverse,
                        (ReflectAdaptor.get(routerGen().prototype, metadata.target_inverse) as BelongsManyToOne.IMetadata<Router>).foreign_key_field,
                        (ReflectAdaptor.get(routerGen().prototype, metadata.my_inverse) as BelongsManyToOne.IMetadata<Router>).foreign_key_field,
                        [
                            get_primary_field("Has.ManyToMany", this.constructor),
                            get_primary_field("Has.ManyToMany", targetGen())
                        ],
                        comparator
                    );
                }
                return this[label];
            }
        });
    };
}

export namespace HasManyToMany
{
    /**
     * @internal
     */
    export interface IMetadata<Target extends object, Router extends object>
    {
        type: "Has.ManyToMany";
        target: () => Creator<Target>;
        router: () => Creator<Router>;
        target_inverse: string;
        my_inverse: string;
        comparator?: Comparator<ITuple<Target, Router>>;
    }

    export interface ITuple<Target extends object, Router extends object>
    {
        target: Target;
        router: Router;
    }

    export class Accessor<Target extends object, Router extends object>
    {
        private readonly stmt_: orm.SelectQueryBuilder<Router>;
        private readonly getter_: MutableSingleton<Target[]>;

        private constructor
            (
                mine: any, 
                targetFactory: Creator<Target>,
                routerFactory: Creator<Router>,
                targetField: string,
                targetInverseField: string,
                myInverseField: string,
                primaryKeyTuple: [string, string],
                comp?: Comparator<ITuple<Target, Router>>
            )
        {
            this.stmt_ = orm.getRepository(routerFactory)
                .createQueryBuilder(routerFactory.name)
                .innerJoin(targetFactory, targetFactory.name, `${targetFactory.name}.${primaryKeyTuple[1]} = ${routerFactory.name}.${targetInverseField}`)
                .andWhere(`${routerFactory.name}.${myInverseField} = :my_id`, { my_id: mine[primaryKeyTuple[0]] });
            this.getter_ = new MutableSingleton(async () => 
            {
                const routerList: Router[] = await this.stmt_.getMany();
                let tupleList: ITuple<Target, Router>[] = [];

                for (const router of routerList)
                    tupleList.push({
                        router,
                        target: await (router as any)[targetField].get()
                    });
                if (comp)
                    tupleList = tupleList.sort(comp);

                return tupleList.map(({ target }) => target);
            });
        }

        public static create<Target extends object, Router extends object>
            (
                mine: any, 
                targetFactory: Creator<Target>,
                routerFactory: Creator<Router>,
                targetField: string,
                targetInverseField: string,
                myInverseField: string,
                primaryKeyTuple: [string, string],
                comp?: Comparator<ITuple<Target, Router>>
            ): Accessor<Target, Router>
        {
            return new Accessor<Target, Router>(mine, targetFactory, routerFactory, targetField, targetInverseField, myInverseField, primaryKeyTuple, comp);
        }

        public get(): Promise<Target[]>
        {
            return this.getter_.get();
        }

        public set(value: Target[]): Promise<void>
        {
            return this.getter_.set(value);
        }

        public statement(): orm.SelectQueryBuilder<Router>
        {
            return this.stmt_;
        }
    }
}