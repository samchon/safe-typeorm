import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { Belongs } from "../decorators";

export type ModelLike<T extends object, 
        Primary extends PrimaryGeneratedColumnType, 
        Nullable extends boolean | undefined> 
    = T | Belongs.ManyToOne<T, Primary, { nullable: Nullable }> | Belongs.OneToOne<T, Primary, { nullable: Nullable }>;