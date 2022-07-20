import { Belongs } from "../decorators/Belongs";
import { ModelLike } from "./ModelLike";
import { PrimaryColumnType } from "./PrimaryColumnType";
import { SpecialFields } from "./SpecialFields";

export type Field
    = number
    | string
    | boolean
    | Date
    | Belongs.ManyToOne<any, PrimaryColumnType>
    | Belongs.External.ManyToOne<any, PrimaryColumnType>
    | Belongs.OneToOne<any, PrimaryColumnType>
    | Belongs.External.OneToOne<any, PrimaryColumnType>
    | null;

export namespace Field
{
    export type ValueType<Type extends Field> 
        = Type extends string ? Type
        : Type extends (Belongs.ManyToOne<infer Target, infer KeyType, infer Options> | Belongs.External.ManyToOne<infer Target, infer KeyType, infer Options>)
            ? Options extends { nullable: true }
                ? (ModelLike<Target, KeyType, true> | PrimaryColumnType.ValueType<KeyType> | null)
                : (ModelLike<Target, KeyType, false> | PrimaryColumnType.ValueType<KeyType>)
        : Type extends (Belongs.OneToOne<infer Target, infer KeyType, infer Options> | Belongs.External.OneToOne<infer Target, infer KeyType, infer Options>)
            ? Options extends { nullable: true }
                ? (ModelLike<Target, KeyType, true> | PrimaryColumnType.ValueType<KeyType> | null)
                : (ModelLike<Target, KeyType, false> | PrimaryColumnType.ValueType<KeyType>)
        : Type extends Date ? (string | Date)
        : Type;

    export type MemberType<
            T extends { [P in Member]: Field; }, 
            Member extends SpecialFields<T, Field>>
        = Member extends "id"
            ? PrimaryType<T, Member>
            : ValueType<T[Member]>;

    type PrimaryType<
            T extends { [P in Member]: Field; }, 
            Member extends SpecialFields<T, Field>>
        = ValueType<T[Member]> 
        | ModelLike<T, T[Member] extends string ? "uuid" : "int", false>;
}