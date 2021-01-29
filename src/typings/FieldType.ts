import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { Belongs } from "../decorators/Belongs";

export type FieldType 
    = number 
    | string 
    | boolean 
    | Date 
    | Belongs.ManyToOne<any, PrimaryGeneratedColumnType> 
    | Belongs.OneToOne<any, PrimaryGeneratedColumnType>
    | null;