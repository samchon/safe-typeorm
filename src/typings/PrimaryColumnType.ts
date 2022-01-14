import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { StringColumnType } from "./StringColumnType";

export type PrimaryColumnType = PrimaryGeneratedColumnType | StringColumnType;
export namespace PrimaryColumnType
{
    export type ValueType<T extends PrimaryColumnType> = T extends StringColumnType ? string : number;
}