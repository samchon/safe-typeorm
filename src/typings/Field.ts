import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { Belongs } from "../decorators/Belongs";
import { ModelLike } from "./ModelLike";
import { PrimaryGeneratedColumnValueType } from "./PrimaryGeneratedColumnValueType";
import { SpecialFields } from "./SpecialFields";

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
        : Type extends Belongs.ManyToOne<infer Target, infer KeyType, infer Options> 
            ? Options extends { nullable: true }
                ? (ModelLike<Target, KeyType, any> | PrimaryGeneratedColumnValueType<KeyType> | null)
                : (ModelLike<Target, KeyType, false> | PrimaryGeneratedColumnValueType<KeyType>)
        : Type extends Belongs.OneToOne<infer Target, infer KeyType, infer Options>
            ? Options extends { nullable: true }
                ? (ModelLike<Target, KeyType, any> | PrimaryGeneratedColumnValueType<KeyType> | null)
                : (ModelLike<Target, KeyType, false> | PrimaryGeneratedColumnValueType<KeyType>)
        : Type extends Date ? (string | Date)
        : Type;

    export type MemberType<T extends object, Member extends SpecialFields<T, Field>>
        = Member extends "id"
            ? PrimaryType<T, Member>
            : ValueType<T[Member]>;

    type PrimaryType<T extends object, Member extends SpecialFields<T, Field>>
        = ValueType<T[Member]> | ModelLike<T, T[Member] extends string ? "uuid" : "int", false>;
}