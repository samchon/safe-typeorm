import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";
import { PrimaryGeneratedColumn } from "./PrimaryGeneratedColumn";
import { SpecialFields } from "./SpecialFields";

export type Relationship<T extends object> 
    = Belongs.ManyToOne<T, PrimaryGeneratedColumn, any> 
    | Belongs.OneToOne<T, PrimaryGeneratedColumn, any> 
    | Has.OneToOne<T> 
    | Has.OneToMany<T>;

export namespace Relationship
{
    export type TargetType<
            Mine extends object, 
            Field extends SpecialFields<Mine, Relationship<any>>>
        = Mine[Field] extends Belongs.ManyToOne<infer Target, any> ? Target
        : Mine[Field] extends Belongs.OneToOne<infer Target, any> ? Target
        : Mine[Field] extends Has.OneToMany<infer Target> ? Target
        : Mine[Field] extends Has.OneToOne<infer Target> ? Target
        : never;
}