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
/**
 * Get column name.
 * 
 * `getColumn()` is a global function returning the column name. 
 * 
 * Unlike writing the column name by yourself manually who can result in the critical runtime 
 * error by a typing error, the `getColumn()` can detect the typing error in the compile level. 
 * 
 * The `getColumn()` even supports the table alias, therefore the table alias addicted column name 
 * also can take advantage of the compile time validation. In such reason, if you don't ignore 
 * error message from the TypeScript compiler, there can't be any runtime error that is caused by 
 * the mis-typing error in the SQL column specification level.
 * 
 * @template T Type of a model class
 * @template Field Type of a literal who represents the field that is defined in the *T* model
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param alias Alias of the target column
 * @return The exact column name who never can be the runtime error
 */
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
/**
 * Get arguments for the where-equal query.
 * 
 * @template T Type of a model class
 * @template Field Type of a literal who represents the field that is defined in the *T*
 * @param creator The target model class
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param param A parameter for the where-equal query
 * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods, which 
 *         never can be the runtime error
 */
export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        param: FieldValueType<T[Field]>
    ): [string, { [key: string]: FieldValueType<T[Field]> }];

/**
 * Get arguments for the where query.
 * 
 * @template T Type of a model class
 * @template Field Type of a literal who represents the field that is defined in the *T*
 * @param creator The target model class
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param operator Operator for the where condition
 * @param param A parameter for the where query
 * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods, which 
 *         never can be the runtime error
 */
export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        operator: OperatorType,
        param: FieldValueType<T[Field]>
    ): [string, { [key: string]: FieldValueType<T[Field]> }];

/**
 * Get arguments for the where-in query.
 * 
 * @template T Type of a model class
 * @template Field Type of a literal who represents the field that is defined in the *T*
 * @param creator The target model class
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param operator Operator "BETWEEN" for the where condition
 * @param parameters Parameters for the where-in query
 * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods, which 
 *         never can be the runtime error
 */
export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        operator: "IN",
        parameters: Array<FieldValueType<T[Field]>>
    ): [string, { [key: string]: Array<FieldValueType<T[Field]>> }];

/**
 * Get arguments for the where-between query.
 * 
 * @template T Type of a model class
 * @template Field Type of a literal who represents the field that is defined in the *T*
 * @param creator The target model class
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param operator Operator "BETWEEN" for the where condition
 * @param minimum Minimum parameter of the between range
 * @param maximum Maximum parameter of the between range
 * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods, which 
 *         never can be the runtime error
 */
export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        operator: "BETWEEN",
        minimum: FieldValueType<T[Field]>,
        maximum: FieldValueType<T[Field]>
    ): [string, { [key: string]: Array<FieldValueType<T[Field]>> }];

export function getWhereArguments<T extends object, Field extends SpecialFields<T, FieldType>>
    (
        creator: CreatorType<T>,
        fieldLike: `${Field}` | `${string}.${Field}`,
        ...rest: any[]
    ): [string, any]
{
    const column: string = getColumn(creator, fieldLike);

    // MOST OPERATORS
    if (rest.length <= 2)
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
        return [`${column} ${operator} :${uuid}`, { [uuid]: param }];
    }

    // BETWEEN OPERATOR
    const from: string = crypto.randomBytes(64).toString("hex");
    const to: string = crypto.randomBytes(64).toString("hex");;
    const minimum: FieldValueType<T[Field]> = rest[1];
    const maximum: FieldValueType<T[Field]> = rest[2];

    return [`${column} BETWEEN :${from} AND :${to}`, 
    {
        [from]: minimum,
        [to]: maximum
    }];
}