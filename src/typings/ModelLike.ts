import { Belongs } from "../decorators";
import { PrimaryGeneratedColumn } from "./PrimaryGeneratedColumn";

export type ModelLike<T extends object, 
        Primary extends PrimaryGeneratedColumn, 
        Nullable extends boolean> 
    = T 
    | Belongs.ManyToOne<T, Primary, { nullable: Nullable extends true ? true : (false | undefined) }> 
    | Belongs.OneToOne<T, Primary, { nullable: Nullable extends true ? true : (false | undefined) }>;