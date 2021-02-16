import { Belongs } from "../decorators/Belongs"

import { OmitNever } from "./OmitNever";
import { PrimaryGeneratedColumn } from "./PrimaryGeneratedColumn";

import { DEFAULT } from "../DEFAULT"

export type Initialized<T extends object> 
    = OmitNever<Initialized.Essential<T>>
    & OmitNever<Initialized.Nullable<T>>;

export namespace Initialized
{
    export type Essential<T extends object> = 
    {
        [P in keyof T]: T[P] extends (boolean | number | string | Date)
            ? (T[P] | DEFAULT)
            : T[P] extends Belongs.OneToOne<infer Entity, infer Primary, infer Options>
                ? Options extends { nullable: true }
                    ? never
                    : Entity | PrimaryGeneratedColumn.ValueType<Primary>
            : T[P] extends Belongs.ManyToOne<infer Entity, infer Primary, infer Options>
                ? Options extends { nullable: true }
                    ? never
                    : Entity | PrimaryGeneratedColumn.ValueType<Primary>
            : never;
    };

    export type Nullable<T extends object> = 
    {
        [P in keyof T]: T[P] extends ((boolean | number | string | Date)) | null
            ? (T[P] | DEFAULT | null)
            : T[P] extends Belongs.OneToOne<infer Entity, infer Primary, infer Options>
                ? Options extends { nullable: true }
                    ? Entity | PrimaryGeneratedColumn.ValueType<Primary> | null
                    : never
            : T[P] extends Belongs.ManyToOne<infer Entity, infer Primary, infer Options>
            ? Options extends { nullable: true }
                ? Entity | PrimaryGeneratedColumn.ValueType<Primary> | null
                : never
            : never;
    };
}
