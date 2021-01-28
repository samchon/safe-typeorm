import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";

import { IEntity } from "../IEntity";
import { RelationshipType } from "./RelationshipType";
import { SpecialFields } from "./SpecialFields";

export type TargetType<Mine extends IEntity<any>, Field extends SpecialFields<Mine, RelationshipType<any>>>
    = Mine[Field] extends Belongs.ManyToOne<infer Target, any> ? Target
    : Mine[Field] extends Belongs.OneToOne<infer Target, any> ? Target
    : Mine[Field] extends Has.OneToOne<infer Target> ? Target
    : Mine[Field] extends Has.OneToMany<infer Target> ? Target
    : never;