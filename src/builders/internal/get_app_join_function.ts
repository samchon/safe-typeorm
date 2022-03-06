import { Singleton } from "tstl/thread/Singleton";
import { Has } from "../../decorators";
import { Belongs } from "../../decorators/Belongs";

import { app_join_belongs_many_to_one } from "./app_join_belongs_many_to_one";
import { app_join_belongs_one_to_one } from "./app_join_belongs_one_to_one";
import { app_join_has_many_to_many } from "./app_join_has_many_to_many";
import { app_join_has_one_to_many } from "./app_join_has_one_to_many";
import { app_join_has_one_to_one } from "./app_join_has_one_to_one";

/**
 * @internal
 */
export function get_app_join_function(type: Type)
{
    return singleton.get()[type];
}

/**
 * @internal
 */
type Type 
    = Deduct<Belongs.ManyToOne.IMetadata<any>>
    | Deduct<Belongs.OneToOne.IMetadata<any>>
    | Deduct<Has.OneToOne.IMetadata<any>>
    | Deduct<Has.OneToMany.IMetadata<any>>
    | Deduct<Has.ManyToMany.IMetadata<any, any>>
    | Deduct<Belongs.External.ManyToOne.IMetadata<any>>
    | Deduct<Belongs.External.OneToOne.IMetadata<any>>
    | Deduct<Has.External.OneToOne.IMetadata<any>>
    | Deduct<Has.External.OneToMany.IMetadata<any>>;

/**
 * @internal
 */
type Deduct<T extends { type: string }> = T extends { type: infer Type } ? Type : never;

/**
 * @internal
 */
const singleton = new Singleton(() => ({
    "Belongs.ManyToOne": app_join_belongs_many_to_one,
    "Belongs.External.ManyToOne": app_join_belongs_many_to_one,
    "Belongs.OneToOne": app_join_belongs_one_to_one,
    "Belongs.External.OneToOne": app_join_belongs_one_to_one,
    "Has.OneToOne": app_join_has_one_to_one,
    "Has.External.OneToOne": app_join_has_one_to_one,
    "Has.OneToMany": app_join_has_one_to_many,
    "Has.External.OneToMany": app_join_has_one_to_many,
    "Has.ManyToMany": app_join_has_many_to_many
}));