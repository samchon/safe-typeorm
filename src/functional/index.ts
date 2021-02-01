import * as crypto from "crypto";
import * as orm from "typeorm";

import { Belongs } from "../decorators/Belongs";
import { JoinQueryBuilder } from "../JoinQueryBuilder";
import { DEFAULT } from "../DEFAULT";

import { Creator } from "../typings/Creator";
import { Field } from "../typings/Field";
import { Initialized } from "../typings/Initialized";
import { Operator } from "../typings/Operator";
import { SpecialFields } from "../typings/SpecialFields";

/**
 * Initialize a model instance.
 * 
 * `initailize()` is a global function creating a new model instance very safely.
 * 
 * Unlike `TypeORM.Repository.create()` method, who can cause the critical runtime error by
 * ommitting essential variables, the `initialize()` function does nott permit ommitting the 
 * essential member variables in the compilation level.
 * 
 * In such reason, if you don't ignore error message from the TypeScript compiler, there can't be 
 * any runtime error that is caused by the ommitting essential column values in the SQL INSERT or 
 * UPDATE level.
 * 
 * @template T Type of a model class that is derived from the `Model`
 * @param input Variables that would be assigned to the new model instance
 * @return A new model instance
 */
export function initialize<T extends object>
    (creator: Creator<T>, input: Initialized<T>): T
{
    const ret: T = new creator();
    for (const tuple of Object.entries(input))
    {
        const value: any = tuple[1];
        if (value === DEFAULT || value === null)
            continue;

        const key: string = tuple[0];
        const type = typeof value;

        if ((ret as any)[key] instanceof Belongs.HELPER_TYPE)
        {
            if (value instanceof Object)
                (ret as any)[key].set(value);
            else
                (ret as any)[key].id = value;
        }
        else if (type === "boolean" || type === "number" || type === "string" || value instanceof Date)
            (ret as any)[key] = value;
    }
    return ret;
}

/* -----------------------------------------------------------
    JOIN
----------------------------------------------------------- */
/**
 * Create join query builder.
 * 
 * `createJoinQueryBuilder()` is a global function who returns not only the 
 * `TypeORM.SelectQueryBuilder` instance but also the {@link JoinQueryBuilder} instance, who can 
 * join related tabless very easily and safely, through the callback function *closure*.
 * 
 * Unlike the traditional join query through the `TypeORM.SelectQueryBuilder.innerJoin()` and some 
 * similar methods, who can cause the critical runtime error by a mis-typing error, the 
 * {@link JoinQueryBuilder.innerJoin} and similar methods can prevent the mis-typing error in the 
 * compilation level.
 * 
 * Therefore, if you don't ignore error message from the TypeScript compiler, there can't be
 * any runtime error that is caused by the mis-typing error in the SQL join query level.
 * 
 * @template T Type of a model class
 * @param closure A callback function who can join related tables very easily and safely
 * @return The newly created `TyperORM.SelectQueryBuilder` instance
 */
export function createJoinQueryBuilder<T extends object>
    (
        creator: Creator<T>, 
        closure: (builder: JoinQueryBuilder<T>) => void
    ): orm.SelectQueryBuilder<T>;

/**
 * Create join query builder with alias.
 * 
 * `createJoinQueryBuilder()` is a global function who returns not only the 
 * `TypeORM.SelectQueryBuilder` instance but also the {@link JoinQueryBuilder} instance, who can 
 * join related tabless very easily and safely, through the callback function *closure*.
 * 
 * Unlike the traditional join query through the `TypeORM.SelectQueryBuilder.innerJoin()` and some 
 * similar methods, who can cause the critical runtime error by a mis-typing error, the 
 * {@link JoinQueryBuilder.innerJoin} and similar methods can prevent the mis-typing error in the 
 * compilation level.
 * 
 * Therefore, if you don't ignore error message from the TypeScript compiler, there can't be
 * any runtime error that is caused by the mis-typing error in the SQL join query level.
 * 
 * @template T Type of a model class
 * @param alias Alias for the table *T*
 * @param closure A callback function who can join related tables very easily and safely
 * @return The newly created `TyperORM.SelectQueryBuilder` instance
 */
export function createJoinQueryBuilder<T extends object>
    (
        creator: Creator<T>, 
        alias: string,
        closure: (builder: JoinQueryBuilder<T>) => void
    ): orm.SelectQueryBuilder<T>;

export function createJoinQueryBuilder<T extends object>
    (creator: Creator<T>, ...args: any[]): orm.SelectQueryBuilder<T>
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
 * error by a typing error, the `getColumn()` can detect the typing error in the compilation level. 
 * 
 * The `getColumn()` even supports the table alias, therefore the table alias addicted column name 
 * also can take advantage of the compile time validation. In such reason, if you don't ignore 
 * error message from the TypeScript compiler, there can't be any runtime error that is caused by 
 * the mis-typing error in the SQL column specification level.
 * 
 * @template T Type of a model class
 * @template Literal Type of a literal who represents the field that is defined in the *T* model
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param alias Alias of the target column
 * @return The exact column name who never can be the runtime error
 */
export function getColumn<T extends object, Literal extends SpecialFields<T, Field>>
    (
        creator: Creator<T>, 
        fieldLike: `${Literal}` | `${string}.${Literal}`,
        alias?: string
    ): string
{
    const index: number = (<string>fieldLike).indexOf(".");
    let tableAlias: string;
    let field: Literal;

    if (index === -1)
    {
        tableAlias = creator.name;
        field = fieldLike as Literal;
    }
    else
    {
        tableAlias = (<string>fieldLike).substr(0, index);
        field = (<string>fieldLike).substr(index + 1) as Literal;
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
 * `Model.getWhereArguments()` is a static method returning arguments for the 
 * `TypeORM.SelectQueryBuilder.where()` and similar methods.
 * 
 * Unlike writing parameters of the `TypeORM.SelectQueryBuilder.where()` or similar methods by 
 * yourself manullay, who can cause critical runtime error by a mis-typing error, the
 * `Model.getWhereArguments()` can prevent the mis-typing error in the compilation level.
 * 
 * The `Model.getWhereArguments()` even supports the table alias, therefore the table alias 
 * addicted column also can take advantage of the compile time validation. In such reason, if you 
 * don't ignore error message from the TypeScript error, there can't be any runtime error that is 
 * caused by the mis-typing error in the SQL where query level.
 * 
 * @template T Type of a model class
 * @template Literal Type of a literal who represents the field that is defined in the *T*
 * @param creator The target model class
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param param A parameter for the where-equal query
 * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods, which 
 *         never can be the runtime error
 */
export function getWhereArguments<T extends object, Literal extends SpecialFields<T, Field>>
    (
        creator: Creator<T>,
        fieldLike: `${Literal}` | `${string}.${Literal}`,
        param: Field.ValueType<T[Literal]>
    ): [string, { [key: string]: Field.ValueType<T[Literal]> }];

/**
 * Get arguments for the where query.
 * 
 * `Model.getWhereArguments()` is a static method returning arguments for the 
 * `TypeORM.SelectQueryBuilder.where()` and similar methods.
 * 
 * Unlike writing parameters of the `TypeORM.SelectQueryBuilder.where()` or similar methods by 
 * yourself manullay, who can cause critical runtime error by a mis-typing error, the
 * `Model.getWhereArguments()` can prevent the mis-typing error in the compilation level.
 * 
 * The `Model.getWhereArguments()` even supports the table alias, therefore the table alias 
 * addicted column also can take advantage of the compile time validation. In such reason, if you 
 * don't ignore error message from the TypeScript error, there can't be any runtime error that is 
 * caused by the mis-typing error in the SQL where query level.
 * 
 * @template T Type of a model class
 * @template Literal Type of a literal who represents the field that is defined in the *T*
 * @param creator The target model class
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param operator Operator for the where condition
 * @param param A parameter for the where query
 * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods, which 
 *         never can be the runtime error
 */
export function getWhereArguments<T extends object, Literal extends SpecialFields<T, Field>>
    (
        creator: Creator<T>,
        fieldLike: `${Literal}` | `${string}.${Literal}`,
        operator: Operator,
        param: Field.ValueType<T[Literal]>
    ): [string, { [key: string]: Field.ValueType<T[Literal]> }];

/**
 * Get arguments for the where-in query.
 * 
 * `Model.getWhereArguments()` is a static method returning arguments for the 
 * `TypeORM.SelectQueryBuilder.where()` and similar methods.
 * 
 * Unlike writing parameters of the `TypeORM.SelectQueryBuilder.where()` or similar methods by 
 * yourself manullay, who can cause critical runtime error by a mis-typing error, the
 * `Model.getWhereArguments()` can prevent the mis-typing error in the compilation level.
 * 
 * The `Model.getWhereArguments()` even supports the table alias, therefore the table alias 
 * addicted column also can take advantage of the compile time validation. In such reason, if you 
 * don't ignore error message from the TypeScript error, there can't be any runtime error that is 
 * caused by the mis-typing error in the SQL where query level.
 * 
 * @template T Type of a model class
 * @template Literal Type of a literal who represents the field that is defined in the *T*
 * @param creator The target model class
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param operator Operator "BETWEEN" for the where condition
 * @param parameters Parameters for the where-in query
 * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods, which 
 *         never can be the runtime error
 */
export function getWhereArguments<T extends object, Literal extends SpecialFields<T, Field>>
    (
        creator: Creator<T>,
        fieldLike: `${Literal}` | `${string}.${Literal}`,
        operator: "IN",
        parameters: Array<Field.ValueType<T[Literal]>>
    ): [string, { [key: string]: Array<Field.ValueType<T[Literal]>> }];

/**
 * Get arguments for the where-between query.
 * 
 * `Model.getWhereArguments()` is a static method returning arguments for the 
 * `TypeORM.SelectQueryBuilder.where()` and similar methods.
 * 
 * Unlike writing parameters of the `TypeORM.SelectQueryBuilder.where()` or similar methods by 
 * yourself manullay, who can cause critical runtime error by a mis-typing error, the
 * `Model.getWhereArguments()` can prevent the mis-typing error in the compilation level.
 * 
 * The `Model.getWhereArguments()` even supports the table alias, therefore the table alias 
 * addicted column also can take advantage of the compile time validation. In such reason, if you 
 * don't ignore error message from the TypeScript error, there can't be any runtime error that is 
 * caused by the mis-typing error in the SQL where query level.
 * 
 * @template T Type of a model class
 * @template Literal Type of a literal who represents the field that is defined in the *T*
 * @param creator The target model class
 * @param fieldLike Name of the target field in the model class. The field name can contain the 
 *                  table alias.
 * @param operator Operator "BETWEEN" for the where condition
 * @param minimum Minimum parameter of the between range
 * @param maximum Maximum parameter of the between range
 * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods, which 
 *         never can be the runtime error
 */
export function getWhereArguments<T extends object, Literal extends SpecialFields<T, Field>>
    (
        creator: Creator<T>,
        fieldLike: `${Literal}` | `${string}.${Literal}`,
        operator: "BETWEEN",
        minimum: Field.ValueType<T[Literal]>,
        maximum: Field.ValueType<T[Literal]>
    ): [string, { [key: string]: Array<Field.ValueType<T[Literal]>> }];

export function getWhereArguments<T extends object, Literal extends SpecialFields<T, Field>>
    (
        creator: Creator<T>,
        fieldLike: `${Literal}` | `${string}.${Literal}`,
        ...rest: any[]
    ): [string, any]
{
    const column: string = getColumn(creator, fieldLike);

    // MOST OPERATORS
    if (rest.length <= 2)
    {
        const uuid: string = crypto.randomBytes(64).toString("hex");
        let operator: Operator;
        let param: Field.ValueType<T[Literal]>

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
    const minimum: Field.ValueType<T[Literal]> = rest[1];
    const maximum: Field.ValueType<T[Literal]> = rest[2];

    return [`${column} BETWEEN :${from} AND :${to}`, 
    {
        [from]: minimum,
        [to]: maximum
    }];
}