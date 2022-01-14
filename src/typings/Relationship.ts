import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";
import { PrimaryColumnType } from "./PrimaryColumnType";
import { SpecialFields } from "./SpecialFields";

export type Relationship<T extends object> = Relationship.Joinable<T> 
    | Has.ManyToMany<T, any>
    | Has.External.OneToMany<T>
    | Has.External.OneToMany<T>
    | Belongs.External.ManyToOne<T, any>
    | Belongs.External.OneToOne<T, any>;
export namespace Relationship
{
    export type TargetType<
            Mine extends object, 
            Field extends SpecialFields<Mine, Relationship<any>>>
        = Mine[Field] extends Belongs.ManyToOne<infer Target, any> ? Target
        : Mine[Field] extends Belongs.OneToOne<infer Target, any> ? Target
        : Mine[Field] extends Has.OneToOne<infer Target> ? Target
        : Mine[Field] extends Has.OneToMany<infer Target> ? Target
        : Mine[Field] extends Has.ManyToMany<infer Target, any> ? Target
        : Mine[Field] extends Has.External.OneToMany<infer Target> ? Target
        : Mine[Field] extends Has.External.OneToOne<infer Target> ? Target
        : Mine[Field] extends Belongs.External.OneToOne<infer Target, any> ? Target
        : Mine[Field] extends Belongs.External.ManyToOne<infer Target, any> ? Target
        : never;

    export type Joinable<T extends object>
        = Belongs.ManyToOne<T, PrimaryColumnType, any> 
        | Belongs.OneToOne<T, PrimaryColumnType, any> 
        | Has.OneToOne<T> 
        | Has.OneToMany<T>;

    export namespace Joinable
    {
        export type TargetType<
                Mine extends object, 
                Field extends SpecialFields<Mine, Joinable<any>>>
            = Mine[Field] extends Belongs.ManyToOne<infer Target, any> ? Target
            : Mine[Field] extends Belongs.OneToOne<infer Target, any> ? Target
            : Mine[Field] extends Has.OneToOne<infer Target> ? Target
            : Mine[Field] extends Has.OneToMany<infer Target> ? Target
            : never;
    }
}