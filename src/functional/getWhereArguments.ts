import * as crypto from "crypto";
import * as orm from "typeorm";
import { InvalidArgument } from "tstl/exception/InvalidArgument";

import { Creator } from "../typings/Creator";
import { Field } from "../typings/Field";
import { Operator } from "../typings/Operator";
import { SpecialFields } from "../typings/SpecialFields";

import { BelongsAccessorBase } from "../decorators/base/BelongsAccessorBase";
import { get_column_name_tuple } from "./internal/get_column_name_tuple";

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
        param: Field.MemberType<T, Literal> | null
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
export function getWhereArguments<
        T extends object, 
        Literal extends SpecialFields<T, Field>,
        OperatorType extends Operator>
    (
        creator: Creator<T>,
        fieldLike: `${Literal}` | `${string}.${Literal}`,
        operator: OperatorType,
        param: OperatorType extends "="|"!="|"<>"
            ? Field.MemberType<T, Literal> | null
            : Field.MemberType<T, Literal> 
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
    const tuple: [string, string] = get_column_name_tuple(creator, fieldLike);
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
            ? `(:...${uuid})`
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
        if (param instanceof BelongsAccessorBase)
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