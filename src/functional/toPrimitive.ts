import * as orm from "typeorm";

import { EncryptedColumn } from "../decorators/EncryptedColumn";

import { Creator } from "../typings/Creator";
import { OmitNever } from "../typings/OmitNever";
import { Primitive } from "../typings/Primitive";

export function toPrimitive<T extends object>(obj: T): Primitive<T>;
export function toPrimitive<T extends object, OmitField extends keyof Primitive<T>>
    (obj: T, ...omitFields: OmitField[]): OmitNever<Omit<Primitive<T>, OmitField>>;

export function toPrimitive(obj: any, ...omitFields: string[]): Record<string, any>
{
    let dict: Set<string> | undefined = fk_dicts.get(obj.constructor);
    if (dict === undefined)
    {
        const metadata: orm.EntityMetadata = orm.getRepository(obj.constructor).metadata;
        dict = new Set();

        for (const foreign of metadata.foreignKeys)
            for (const column of foreign.columns)
            {
                const property: string = column.propertyName;
                dict.add(property);
            }
        fk_dicts.set(obj.constructor, dict);
    }

    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj))
    {
        if (key[0] === "_")
            if (key.substr(0, ENC_SYMBOL.length) === ENC_SYMBOL)
            {
                const property: string = EncryptedColumn.getFieldByIndex(key);
                output[property] = (obj as any)[property];
            }
            else
                continue;
        else if (key[key.length - 1] === "_")
            continue;
        else if (value instanceof Object)
            if (value instanceof Date)
                output[key] = value.toString();
            else
                continue;
        else if (typeof value !== "function" && dict.has(key) === false)
            output[key] = value;
    }
    for (const omit of omitFields)
        delete output[omit];

    return output;
}

const fk_dicts: WeakMap<Creator<any>, Set<string>> = new WeakMap();
const ENC_SYMBOL = "__m_enc_";