import { PrimaryGeneratedColumnType as _PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";

export type PrimaryGeneratedColumn = _PrimaryGeneratedColumnType | "uuid";
export namespace PrimaryGeneratedColumn
{
    export type ValueType<T extends PrimaryGeneratedColumn> = T extends "uuid" ? string : number;
}