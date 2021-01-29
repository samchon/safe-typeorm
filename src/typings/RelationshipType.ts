import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";

export type RelationshipType<T extends object> 
    = Belongs.ManyToOne<T, PrimaryGeneratedColumnType, any> 
    | Belongs.OneToOne<T, PrimaryGeneratedColumnType, any> 
    | Has.OneToOne<T> 
    | Has.OneToMany<T>;