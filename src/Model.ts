import * as crypto from "crypto";
import * as orm from "typeorm";

import { JoinQueryBuilder } from "./JoinQueryBuilder";

import { CreatorType } from "./typings/CreatorType";
import { FieldType } from "./typings/FieldType";
import { FieldValueType } from "./typings/FieldValueType";
import { OperatorType } from "./typings/OperatorType";
import { SpecialFields } from "./typings/SpecialFields";

export abstract class Model extends orm.BaseEntity
{
    public abstract get id(): number;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public static createJoinQueryBuilder<T extends Model>
        (
            this: CreatorType<T>, 
            closure: (builder: JoinQueryBuilder<T>) => void
        ): orm.SelectQueryBuilder<T>
    {
        const stmt: orm.SelectQueryBuilder<T> = this.createQueryBuilder();
        const builder: JoinQueryBuilder<T> = new JoinQueryBuilder(stmt, this);

        closure(builder);
        return stmt;
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
            this: CreatorType<T>, 
            field: Field,
            alias?: string
        ): string
    {
        const fieldName: string = Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, this.prototype)
            ? Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:field`, this.prototype)
            : field as string;
        const ret: string = `${this.name}.${fieldName}`;

        return (alias !== undefined)
            ? `${ret} AS ${alias}`
            : ret;
    }

    public static getWhereArguments<T extends Model, Field extends SpecialFields<T, FieldType>>
        (
            this: CreatorType<T>,
            field: Field,
            param: FieldValueType<T[Field]>
        ): [string, { [key: string]: FieldValueType<T[Field]> }];

    public static getWhereArguments<T extends Model, Field extends SpecialFields<T, FieldType>>
        (
            this: CreatorType<T>,
            field: Field,
            operator: OperatorType,
            param: FieldValueType<T[Field]>
        ): [string, { [key: string]: FieldValueType<T[Field]> }];

    public static getWhereArguments<T extends Model, Field extends SpecialFields<T, FieldType>>
        (
            this: CreatorType<T>,
            field: Field,
            operator: "IN",
            param: Array<FieldValueType<T[Field]>>
        ): [string, { [key: string]: Array<FieldValueType<T[Field]>> }];

    public static getWhereArguments<T extends Model, Field extends SpecialFields<T, FieldType>>
        (
            this: CreatorType<T>,
            field: Field,
            ...rest: any[]
        ): [string, any]
    {
        const uuid: string = `${crypto.randomBytes(64).toString("hex")}_${Date.now()}`;
        let operator: OperatorType;
        let param: FieldValueType<T[Field]>

        if (rest.length === 1)
        {
            operator = "=";
            param = rest[0];
        }
        else
        {
            operator = rest[0];
            param = rest[1];
        }
        return [`${this.getColumn(field)} ${operator} :${uuid}`, { [uuid]: param }];
    }
}