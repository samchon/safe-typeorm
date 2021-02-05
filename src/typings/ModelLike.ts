import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { Belongs } from "../decorators";

export type ModelLike<T extends object, 
        Primary extends PrimaryGeneratedColumnType, 
        Nullable extends boolean> 
    = T 
    | Belongs.ManyToOne<T, Primary, { nullable: Nullable extends true ? true : (false | undefined) }> 
    | Belongs.OneToOne<T, Primary, { nullable: Nullable extends true ? true : (false | undefined) }>;