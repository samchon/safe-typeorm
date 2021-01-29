import * as crypto from "crypto";
import * as orm from "typeorm";

import { JoinQueryBuilder } from "../JoinQueryBuilder";

import { CreatorType } from "../typings/CreatorType";
import { FieldType } from "../typings/FieldType";
import { FieldValueType } from "../typings/FieldValueType";
import { OperatorType } from "../typings/OperatorType";
import { SpecialFields } from "../typings/SpecialFields";

/* -----------------------------------------------------------
    JOIN
----------------------------------------------------------- */
export function createJoinQueryBuilder<T extends object>
    (
        creator: CreatorType<T>, 
        closure: (builder: JoinQueryBuilder<T>) => void
    ): orm.SelectQueryBuilder<T>;

export function createJoinQueryBuilder<T extends object>
    (
        creator: CreatorType<T>, 
        alias: string,
        closure: (builder: JoinQueryBuilder<T>) => void
    ): orm.SelectQueryBuilder<T>;

export function createJoinQueryBuilder<T extends object>
    (creator: CreatorType<T>, ...args: any[]): orm.SelectQueryBuilder<T>
{
    let alias: string;
    let closure: (builder: JoinQueryBuilder<T>) => void;

    if (args.length === 1)
    {
        alias = creator.name;
        closure = args[0];
    }
    else
    {
        alias = args[0];
        closure = args[1];
    }

    const stmt: orm.SelectQueryBuilder<T> = orm
        .getRepository(creator)
        .createQueryBuilder(alias);
    const builder: JoinQueryBuilder<T> = new JoinQueryBuilder(stmt, creator);

    closure(builder)
    return stmt;
}

/* -----------------------------------------------------------
    COLUMN
----------------------------------------------------------- */
export function getColumn<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>, 
        fieldLike: `${Field}` | `${string}.${Field}`,
        alias?: string
    ): string
{
    const index: number = (<string>fieldLike).indexOf(".");
    let tableAlias: string;
    let field: Field;

    if (index === -1)
    {
        tableAlias = creator.name;
        field = fieldLike as Field;
    }
    else
    {
        tableAlias = (<string>fieldLike).substr(0, index);
        field = (<string>fieldLike).substr(index + 1) as Field;
    }

    const fieldName: string = Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, creator.prototype)
        ? Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:field`, creator.prototype)
        : field as string;
    const target: string = `${tableAlias}.${fieldName}`;

    if (alias === undefined)
        alias = fieldName;
    return `${target} AS \`${alias}\``;
}

/* -----------------------------------------------------------
    WHERE
----------------------------------------------------------- */
export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        param: FieldValueType<T[Field]>
    ): [string, { [key: string]: FieldValueType<T[Field]> }];

export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        operator: OperatorType,
        param: FieldValueType<T[Field]>
    ): [string, { [key: string]: FieldValueType<T[Field]> }];

export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        operator: "IN",
        param: Array<FieldValueType<T[Field]>>
    ): [string, { [key: string]: Array<FieldValueType<T[Field]>> }];

export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        ...rest: any[]
    ): [string, any]
{
    const uuid: string = crypto.randomBytes(64).toString("hex");
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
    return [`${getColumn(creator, fieldLike)} ${operator} :${uuid}`, { [uuid]: param }];
}