import { Belongs } from "../decorators";
import { PrimaryColumnType } from "./PrimaryColumnType";

export type ModelLike<T extends object, 
        Primary extends PrimaryColumnType, 
        Nullable extends boolean> 
    = T 
    | Belongs.ManyToOne<T, Primary, { nullable: Nullable extends true ? true : (false | undefined) }> 
    | Belongs.OneToOne<T, Primary, { nullable: Nullable extends true ? true : (false | undefined) }>;