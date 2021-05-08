import { Belongs } from "../decorators/Belongs";
import { ModelLike } from "./ModelLike";
import { PrimaryGeneratedColumn } from "./PrimaryGeneratedColumn";
import { SpecialFields } from "./SpecialFields";

export type Field
    = number
    | string
    | boolean
    | Date
    | Belongs.ManyToOne<any, PrimaryGeneratedColumn>
    | Belongs.OneToOne<any, PrimaryGeneratedColumn>
    | null;

export namespace Field
{
    export type ValueType<Type extends Field> 
        = Type extends string ? string
        : Type extends Belongs.ManyToOne<infer Target, infer KeyType, infer Options> 
            ? Options extends { nullable: true }
                ? (ModelLike<Target, KeyType, true> | PrimaryGeneratedColumn.ValueType<KeyType> | null)
                : (ModelLike<Target, KeyType, false> | PrimaryGeneratedColumn.ValueType<KeyType>)
        : Type extends Belongs.OneToOne<infer Target, infer KeyType, infer Options>
            ? Options extends { nullable: true }
                ? (ModelLike<Target, KeyType, true> | PrimaryGeneratedColumn.ValueType<KeyType> | null)
                : (ModelLike<Target, KeyType, false> | PrimaryGeneratedColumn.ValueType<KeyType>)
        : Type extends Date ? (string | Date)
        : Type;

    export type MemberType<T extends object, Member extends SpecialFields<T, Field>>
        = Member extends "id"
            ? PrimaryType<T, Member>
            : ValueType<T[Member]>;

    type PrimaryType<T extends object, Member extends SpecialFields<T, Field>>
        = ValueType<T[Member]> 
        | ModelLike<T, T[Member] extends string ? "uuid" : "int", false>;
}