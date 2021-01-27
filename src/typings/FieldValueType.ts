import { Belongs } from "../decorators/Belongs";

import { FieldType } from "./FieldType";

export type FieldValueType<Type extends FieldType> 
    = Type extends Belongs.ManyToOne<any, infer Options> 
        ? Options extends { nullable: true }
            ? (number | null)
            : number
    : Type extends Belongs.OneToOne<any, infer Options>
        ? Options extends { nullable: true }
            ? (number | null)
            : number
    : Type extends Date ? (string | Date)
    : Type;