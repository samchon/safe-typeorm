import * as orm from "typeorm";
import * as global from "./global";

import { EncryptedColumn } from "./decorators/EncryptedColumn";
import { JoinQueryBuilder } from "./JoinQueryBuilder";

import { CreatorType as _CreatorType } from "./typings/CreatorType";
import { FieldType } from "./typings/FieldType";
import { FieldValueType } from "./typings/FieldValueType";
import { OperatorType } from "./typings/OperatorType";
import { SpecialFields } from "./typings/SpecialFields";
import { OmitNever } from "./typings/OmitNever";

export abstract class Model extends orm.BaseEntity
{
    public abstract get id(): any;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public static createJoinQueryBuilder<T extends Model>
        (
            this: Model.CreatorType<T>, 
            closure: (builder: JoinQueryBuilder<T>) => void
        ): orm.SelectQueryBuilder<T>;

        public static createJoinQueryBuilder<T extends Model>
        (
            this: Model.CreatorType<T>, 
            alias: string,
            closure: (builder: JoinQueryBuilder<T>) => void
        ): orm.SelectQueryBuilder<T>

    public static createJoinQueryBuilder<T extends Model>
        (
            this: Model.CreatorType<T>, 
            ...args: any[]
        ): orm.SelectQueryBuilder<T>
    {
        return global.createJoinQueryBuilder(this, ...(args as [string, (builder: JoinQueryBuilder<T>) => void]));
    }

    /**
     * Update current entity data to the database.
     * 
     * If the primary key field {@link id} is not {@link IncrementalColumn auto incremental}, the 
     * TypeORM can't distinguish whether a {@link Model} instance is newly created or updated from
     * ordinary. Therefore, when call {@link save} method in a {@link Model} instance whose 
     * {@link id} field is not {@link IncrementalColumn auto incremental}, the TypeORM always 
     * execute the `INSERT` query instead of `UPDATE` statement.
     * 
     * Therefore, when the {@link id} fields is not {@link IncrementalColumn auto incremental}, you
     * have to distinguish `INSERT` and `UPDATE` queries by calling one of the {@link save} and 
     * {@link update} method by yourself.
     */
    public async update(): Promise<void>
    {
        const columnList = orm.getRepository(this.constructor).metadata.columns;
        const props: any = {};
        
        for (const column of columnList)
        {
            const key: string = column.propertyName;
            props[key] = (this as any)[key];
        }
        await orm.getRepository(this.constructor).update(this.id, props);
    }

    /* -----------------------------------------------------------
        SPECIALIZATIONS
    ----------------------------------------------------------- */
    public static getColumn<T extends Model, Field extends SpecialFields<T, FieldType>>
        (
            this: Model.CreatorType<T>, 
            fieldLike: Field | `${string}.${Field}`,
            alias?: string
        ): string
    {
        return global.getColumn<T, Field>(this, fieldLike, alias);
    }

    public static getWhereArguments<T extends Model, Field extends SpecialFields<T, FieldType>>
        (
            this: Model.CreatorType<T>,
            fieldLike: Field | `${string}.${Field}`,
            param: FieldValueType<T[Field]>
        ): [string, { [key: string]: FieldValueType<T[Field]> }];

    public static getWhereArguments<T extends Model, Field extends SpecialFields<T, FieldType>>
        (
            this: Model.CreatorType<T>,
            fieldLike: Field | `${string}.${Field}`,
            operator: OperatorType,
            param: FieldValueType<T[Field]>
        ): [string, { [key: string]: FieldValueType<T[Field]> }];

    public static getWhereArguments<
            T extends Model, 
            Field extends SpecialFields<T, FieldType>>
        (
            this: Model.CreatorType<T>,
            fieldLike: Field | `${string}.${Field}`,
            operator: "IN",
            param: Array<FieldValueType<T[Field]>>,
        ): [string, { [key: string]: Array<FieldValueType<T[Field]>> }];

    public static getWhereArguments<T extends Model, Field extends SpecialFields<T, FieldType>>
        (
            this: Model.CreatorType<T>,
            fieldLike: Field | `${string}.${Field}`,
            ...rest: any[]
        ): [string, any]
    {
        return global.getWhereArguments(this, fieldLike, ...(rest as [ OperatorType, FieldValueType<T[Field]> ]));
    }

    /* -----------------------------------------------------------
        DESERIALIZER
    ----------------------------------------------------------- */
    public toJSON(): Model.Primitive<this>
    {
        const ret: Record<string, any> = {};
        for (const tuple of Object.entries(this))
        {
            const key: string = tuple[0];
            const value: any = tuple[1];

            if (key[0] === "_" || key[key.length - 1] === "_")
                if (key.substr(0, 8) === "__m_enc_")
                {
                    const property: string = EncryptedColumn.getFieldByIndex(key);
                    ret[property] = (this as any)[property];
                }
                else
                    continue;
            else if (value instanceof Object)
                if (value instanceof Date)
                    ret[key] = value.toString();
                else
                    continue;
            else
                ret[key] = value;
        }

        return ret as Model.Primitive<this>;
    }
}

export namespace Model
{
    export type CreatorType<T extends Model> = _CreatorType<T> & typeof Model;

    export type Primitive<T extends Model> = OmitNever<
    {
        [P in keyof T]: T[P] extends (number|string|boolean|Date|null)
            ? T[P] extends Date
                ? T[P] extends null ? (string|null) : string
                : T[P]
            : never;
    }>;
}