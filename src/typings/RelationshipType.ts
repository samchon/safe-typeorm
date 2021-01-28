import { IEntity } from "../IEntity";
import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";

export type RelationshipType<T extends IEntity<any>> 
    = Belongs.ManyToOne<T> 
    | Belongs.OneToOne<T> 
    | Has.OneToOne<T> 
    | Has.OneToMany<T>;