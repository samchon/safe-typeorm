import { Column, ColumnOptions, Index } from "typeorm";

import { AesPkcs5 } from "../utils/AesPkcs5";
import { SpecialFields } from "../typings/SpecialFields";

/**
 * Decorator for special column storing encrypted data.
 * 
 * @param type Column type.
 * @param options Additional options.
 * @return The decorator function.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export function EncryptedColumn(type: EncryptedColumn.Type, options: EncryptedColumn.IOptions): Function
{
    return function (target: any, key: string)
    {
        const field: string = EncryptedColumn.getIndexField(key);

        Column(type as "varchar", { ...options, name: key })(target, field);
        if (options.index === true)
            Index()(target, field);

        Object.defineProperty(target, key, 
        {
            get: function (): string | null
            {
                const content: string | null = this[field];
                if (content === null || content === undefined)
                    return null;
                else
                {
                    const password: EncryptedColumn.IPassword = (options.password instanceof Function)
                        ? options.password(content, false)
                        : options.password;
                    return AesPkcs5.decode(content, password.key, password.iv);
                }
            },
            set: function (content: string | null): void
            {
                if (content === null || content === undefined)
                {
                    this[field] = null;
                    return;
                }

                const password: EncryptedColumn.IPassword = (options.password instanceof Function)
                    ? options.password(content, true)
                    : options.password;
                this[field] = AesPkcs5.encode(content, password.key, password.iv);
            }
        });
    };
}
export namespace EncryptedColumn
{
    /**
     * Type of an encrypted column.
     */
    export type Type = "varchar" | "text" | "longtext";

    /**
     * Detailed options of an encrypted column,
     */
    export interface IOptions extends Omit<ColumnOptions, "type">
    {
        password: IPassword | IPassword.Closure;
        index?: boolean;
    }

    /**
     * Password for the encryption.
     */
    export interface IPassword
    {
        key: string;
        iv: string;
    }
    export namespace IPassword
    {
        /**
         * Closure function type generating a password referencing the content.
         */
        export type Closure = (content: string, isEncode: boolean) => IPassword;
    }

    /**
     * Get raw value from an encrypted column.
     * 
     * @param record Target record.
     * @param field Target field.
     * @return The raw value.
     */
    export function get_raw_value<Entity extends object, Field extends SpecialFields<Entity, string|null>>
        (record: Entity, field: Field): Field extends SpecialFields<Entity, string> ? string : string | null
    {
        let hidden: string = getIndexField(<any>field as string);
        return (record as any)[hidden];
    }

    export function getIndexField(key: string): string
    {
        return `__m_enc_${key}__`;
    }

    /**
     * @internal
     */
    export function getFieldByIndex(index: string): string
    {
        return index.substring(8, index.length - 2);
    }
}