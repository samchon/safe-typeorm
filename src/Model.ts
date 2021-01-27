import * as orm from "typeorm";

import { JoinQueryBuilder } from "./JoinQueryBuilder";

import { CreatorType } from "./typings/CreatorType";
import { FieldType } from "./typings/FieldType";
import { FieldValueType } from "./typings/FieldValueType";
import { SpecialFields } from "./typings/SpecialFields";

export abstract class Model extends orm.BaseEntity
{
    public abstract get id(): number;

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
            param: { [key: string]: FieldValueType<T[Field]> },
            operator: string = "="
        ): [string, object]
    {
        const entries = Object.entries(param);
        if (entries.length !== 1)
            throw new Error(`Error on getWhereArguments(): number of properties store in the param must not ${entries.length} but 1.`);

        return [`${this.getColumn(field)} ${operator} :${entries[0][0]}`, param];
    }

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
}