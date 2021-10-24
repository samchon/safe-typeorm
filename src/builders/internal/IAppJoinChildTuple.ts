import { AppJoinBuilder } from "../AppJoinBuilder";
import { ReflectAdaptor } from "../../decorators/base/ReflectAdaptor";

import { Relationship } from "../../typings/Relationship";

/**
 * @internal
 */
export interface IAppJoinChildTuple<
        Mine extends object, 
        Metadata extends ReflectAdaptor.Metadata<Relationship.TargetType<Mine, any>> = ReflectAdaptor.Metadata<Relationship.TargetType<Mine, any>>>
{
    metadata: Metadata;
    builder: AppJoinBuilder<Relationship.TargetType<Mine, any>>;
}