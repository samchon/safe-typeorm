import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { Belongs } from "../decorators/Belongs";

export type Field
    = number 
    | string 
    | boolean 
    | Date 
    | Belongs.ManyToOne<any, PrimaryGeneratedColumnType> 
    | Belongs.OneToOne<any, PrimaryGeneratedColumnType>
    | null;

export namespace Field
{
    export type ValueType<Type extends Field> 
        = Type extends string ? string
        : Type extends Belongs.ManyToOne<any, infer Options> 
            ? Options extends { nullable: true }
                ? (number | null)
                : number
        : Type extends Belongs.OneToOne<any, infer Options>
            ? Options extends { nullable: true }
                ? (number | null)
                : number
        : Type extends Date ? (string | Date)
        : Type;
}