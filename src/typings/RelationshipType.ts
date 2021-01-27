import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";

import { Model } from "../Model";

export type RelationshipType<T extends Model> 
    = Belongs.ManyToOne<T> 
    | Belongs.OneToOne<T> 
    | Has.OneToOne<T> 
    | Has.OneToMany<T>;