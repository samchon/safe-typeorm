import * as crypto from "crypto";
import * as orm from "typeorm";
import { InvalidArgument } from "tstl";

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
 * Create join query builder from manager.
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
 * @param manager Entity manager of TypeORM, maybe used for the transaction scope
 * @param closure A callback function who can join related tables very easily and safely
 * @return The newly created `TyperORM.SelectQueryBuilder` instance
 */
export function createJoinQueryBuilder<T extends object>
    (
        manager: orm.EntityManager,
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

/**
 * Create join query builder from manager with alias.
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
 * @param manager Entity manager of TypeORM, maybe used for the transaction scope
 * @param alias Alias for the table *T*
 * @param closure A callback function who can join related tables very easily and safely
 * @return The newly created `TyperORM.SelectQueryBuilder` instance
 */
export function createJoinQueryBuilder<T extends object>
    (
        manager: orm.EntityManager,
        creator: Creator<T>, 
        alias: string,
        closure: (builder: JoinQueryBuilder<T>) => void
    ): orm.SelectQueryBuilder<T>;

export function createJoinQueryBuilder<T extends object>
    (...args: any[]): orm.SelectQueryBuilder<T>
{
    // LIST UP PARAMETERS
    const manager: orm.EntityManager | null = args[0] instanceof orm.EntityManager
        ? args[0]
        : null;
    const creator: Creator<T> = (manager !== null) ? args[1] : args[0];
    args.splice(0, manager !== null ? 2 : 1);

    // LIST UP ALIAS AND CLOSURE
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

    const stmt: orm.SelectQueryBuilder<T> = (manager !== null ? manager : orm)
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
        alias?: string | null
    ): string
{
    const tuple: [string, string] = _Get_column(creator, fieldLike);
    if (alias === undefined)
        alias = tuple[1];

    const target: string = tuple[0] 
        ? `${tuple[0]}.${tuple[1]}`
        : tuple[1];
    return (alias === null)
        ? target
        : `${target} AS \`${alias}\``;
}

function _Get_column<T extends object, Literal extends SpecialFields<T, Field>>
    (
        creator: Creator<T>, 
        fieldLike: `${Literal}` | `${string}.${Literal}`
    ): [string, string]
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
    return [tableAlias, fieldName];
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
        param: Field.MemberType<T, Literal>
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
        param: Field.MemberType<T, Literal>
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
        parameters: Array<Field.MemberType<T, Literal>>
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
        minimum: Field.MemberType<T, Literal>,
        maximum: Field.MemberType<T, Literal>
    ): [string, { [key: string]: Array<Field.ValueType<T[Literal]>> }];

export function getWhereArguments<T extends object, Literal extends SpecialFields<T, Field>>
    (
        creator: Creator<T>,
        fieldLike: `${Literal}` | `${string}.${Literal}`,
        ...rest: any[]
    ): [string, any]
{
    const tuple: [string, string] = _Get_column(creator, fieldLike);
    const column: string = tuple[0]
        ? `${tuple[0]}.${tuple[1]}`
        : tuple[1];

    // MOST OPERATORS
    if (rest.length <= 2)
    {
        // SPECIALIZE OPERATOR AND PARAMETER
        let operator: Operator | "IN";
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
        param = _Decompose_parameter(param);

        // IS NULL || IS-NOT-NULL
        if (param === null)
        {
            if (operator === "=")
                return [`${column} IS NULL`] as any;
            else if (operator === "!=" || operator === "<>")
                return [`${column} IS NOT NULL`] as any;
            else
                throw new InvalidArgument(`Error on ${creator.name}.getColumn(): unable to bind null value for the ${operator} operator.`);
        }

        // RETURNS WITH BINDING
        const uuid: string = crypto.randomBytes(64).toString("hex");
        const binding: string = (operator === "IN")
            ? `(:${uuid})`
            : `:${uuid}`;
        return [`${column} ${operator} ${binding}`, { [uuid]: param }];
    }

    // BETWEEN OPERATOR
    const from: string = crypto.randomBytes(64).toString("hex");
    const to: string = crypto.randomBytes(64).toString("hex");;
    const minimum: Field.ValueType<T[Literal]> = _Decompose_entity(rest[1]);
    const maximum: Field.ValueType<T[Literal]> = _Decompose_entity(rest[2]);

    return [`${column} BETWEEN :${from} AND :${to}`, 
    {
        [from]: minimum,
        [to]: maximum
    }];
}

function _Decompose_parameter(param: any): any
{
    if (param instanceof Array && param.length !== 0)
        return param.map(p => _Decompose_entity(p));
    else
        return _Decompose_entity(param);
}

function _Decompose_entity(param: any): any
{
    if (param instanceof Object && !(param instanceof Date))
    {
        if (param instanceof Belongs.HELPER_TYPE)
            param = param.id;
        else
        {
            const pkField: string | undefined = orm.getRepository(param.constructor).metadata.primaryColumns[0]?.propertyName;
            if (pkField !== undefined)
                param = param[pkField];
        }
    }
    return param;
}