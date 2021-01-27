import { Belongs } from "../Belongs";
import { Has } from "../Has";
import { Model } from "../Model";

export type RelationshipType<T extends Model> 
    = Belongs.ManyToOne<T> 
    | Belongs.OneToOne<T> 
    | Has.OneToOne<T> 
    | Has.OneToMany<T>;