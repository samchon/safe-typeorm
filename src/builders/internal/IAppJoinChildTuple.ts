import * as orm from "typeorm";

import { ReflectAdaptor } from "../../decorators/base/ReflectAdaptor";

import { Relationship } from "../../typings/Relationship";

import { AppJoinBuilder } from "../AppJoinBuilder";

/**
 * @internal
 */
export interface IAppJoinChildTuple<
    Mine extends object,
    Metadata extends ReflectAdaptor.Metadata<
        Relationship.TargetType<Mine, any>
    > = ReflectAdaptor.Metadata<Relationship.TargetType<Mine, any>>,
> {
    metadata: Metadata;
    builder: AppJoinBuilder<Relationship.TargetType<Mine, any>>;
    filter:
        | null
        | ((
              stmt: orm.SelectQueryBuilder<Relationship.TargetType<Mine, any>>,
          ) => void);
}
export namespace IAppJoinChildTuple {
    export interface IOptions<Target extends object> {
        filter: null | ((stmt: orm.SelectQueryBuilder<Target>) => void);
        targetData: Target[] | null;
    }
}
