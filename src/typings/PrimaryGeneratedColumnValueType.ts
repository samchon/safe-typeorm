import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";

export type PrimaryGeneratedColumnValueType<T extends PrimaryGeneratedColumnType>
    = T extends "uuid"
        ? string
        : number;