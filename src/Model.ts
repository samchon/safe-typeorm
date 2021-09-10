import * as orm from "typeorm";

import { JoinQueryBuilder } from "./builders/JoinQueryBuilder";

import { Creator as _Creator } from "./typings/Creator";
import { Field } from "./typings/Field";
import { Initialized } from "./typings/Initialized";
import { OmitNever } from "./typings/OmitNever";
import { Operator } from "./typings/Operator";
import { Primitive } from "./typings/Primitive";
import { SpecialFields } from "./typings/SpecialFields";

import { createJoinQueryBuilder } from "./functional/createJoinQueryBuilder";
import { getColumn } from "./functional/getColumn";
import { getWhereArguments } from "./functional/getWhereArguments";
import { initialize } from "./functional/initialize";
import { insert } from "./functional/insert";
import { toPrimitive } from "./functional/toPrimitive";
import { update } from "./functional/update";

/**
 * The basic model class.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export abstract class Model extends orm.BaseEntity
{
    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Initialize a model instance.
     * 
     * `Model.initailize()` is a static method creating a new model instance very safely.
     * 
     * Unlike `TypeORM.BaseEntity.create()` method, who can cause the critical runtime error by
     * ommitting essential variables, the `Model.initialize()` does not permit ommitting the 
     * essential member variables in the compilation level.
     * 
     * In such reason, if you don't ignore error message from the TypeScript compiler, there can't
     * be any runtime error that is caused by the ommitting essential column values in the SQL 
     * INSERT or UPDATE level.
     * 
     * @template T Type of a model class that is derived from the `Model`
     * @param input Variables that would be assigned to the new model instance
     * @return A new model instance
     */
    public static initialize<T extends Model>
        (
            this: Model.Creator<T>, 
            input: Initialized<T>
        ): T
    {
        return initialize(this, input);
    }

    public async insert(manager: orm.EntityManager): Promise<void>
    {
        await insert(manager || orm.getManager(), this);
    }

    /**
     * Update current entity data to the database.
     * 
     * If the primary key field is not a type of the {@link PrimaryGeneratedColumn}, `TypeORM` 
     * can't distinguish whether a {@link Model} instance is newly created or updated from 
     * ordinary. 
     * 
     * Therefore, when you call the {@link save} method in a {@link Model} instance whose primary 
     * key field a type of is not {@link PrimaryGeneratedColumn}, the `TypeORM` always execute the 
     * `INSERT` query instead of the `UPDATE` statement.
     * 
     * In such reason, when type of a primary is not the {@link PrimaryGeneratedColumn}, you have 
     * to distinguish `INSERT` and `UPDATE` queries by calling one of the {@link save} and 
     * {@link update} method by yourself.
     * 
     * @param manager EntityManager instance if you're in a transaction scope
     */
    public async update(manager?: orm.EntityManager): Promise<void>
    {
        await update(manager || orm.getManager(), this);
    }

    /* -----------------------------------------------------------
        JOINER
    ----------------------------------------------------------- */
    /**
     * Create join query builder.
     * 
     * `Model.createJoinQueryBuilder()` is a static method who returns not only the 
     * `TypeORM.SelectQueryBuilder` instance but also the {@link JoinQueryBuilder} instance, who 
     * can join related tabless very easily and safely, through the callback function *closure*.
     * 
     * Unlike the traditional join query through the `TypeORM.SelectQueryBuilder.innerJoin()` and
     * some similar methods, who can cause the critical runtime error by a mis-typing error, the 
     * {@link JoinQueryBuilder.innerJoin} and similar methods can prevent the mis-typing error in 
     * the compilation level.
     * 
     * Therefore, if you don't ignore error message from the TypeScript compiler, there can't be
     * any runtime error that is caused by the mis-typing error in the SQL join query level.
     * 
     * @template T Type of a model class that is derived from the `Model`
     * @param closure A callback function who can join related tables very easily and safely
     * @return The newly created `TyperORM.SelectQueryBuilder` instance
     */
    public static createJoinQueryBuilder<T extends Model>
        (
            this: Model.Creator<T>, 
            closure: (builder: JoinQueryBuilder<T>) => void
        ): orm.SelectQueryBuilder<T>;

    /**
     * Create join query builder with alias.
     * 
     * `Model.createJoinQueryBuilder()` is a static method who returns not only the 
     * `TypeORM.SelectQueryBuilder` instance but also the {@link JoinQueryBuilder} instance, who 
     * can join related tabless very easily and safely, through the callback function *closure*.
     * 
     * Unlike the traditional join query through the `TypeORM.SelectQueryBuilder.innerJoin()` and
     * some similar methods, who can cause the critical runtime error by a mis-typing error, the 
     * {@link JoinQueryBuilder.innerJoin} and similar methods can prevent the mis-typing error in 
     * the compilation level.
     * 
     * Therefore, if you don't ignore error message from the TypeScript compiler, there can't be
     * any runtime error that is caused by the mis-typing error in the SQL join query level.
     * 
     * @template T Type of a model class that is derived from the `Model`
     * @param alias Alias for the table *T*
     * @param closure A callback function who can join related tables very easily and safely
     * @return The newly created `TyperORM.SelectQueryBuilder` instance
     */
    public static createJoinQueryBuilder<T extends Model>
        (
            this: Model.Creator<T>, 
            alias: string,
            closure: (builder: JoinQueryBuilder<T>) => void
        ): orm.SelectQueryBuilder<T>

    public static createJoinQueryBuilder<T extends Model>
        (
            this: Model.Creator<T>, 
            ...args: any[]
        ): orm.SelectQueryBuilder<T>
    {
        return createJoinQueryBuilder(this, ...(args as [string, (builder: JoinQueryBuilder<T>) => void]));
    }

    /* -----------------------------------------------------------
        SPECIALIZATIONS
    ----------------------------------------------------------- */
    /**
     * Get column name.
     * 
     * `Model.getColumn()` is a static method returning the column name. 
     * 
     * Unlike writing the column name by yourself manually, who can cause the critical runtime 
     * error by a mis-typing error, the `Model.getColumn()` can prevent the mis-typing error in the 
     * compilation level. 
     * 
     * The `Model.getColumn()` even supports the table alias, therefore the table alias addicted 
     * column name also can take advantage of the compile time validation. In such reason, if you 
     * don't ignore error message from the TypeScript compiler, there can't be any runtime error 
     * that is caused by the mis-typing error in the SQL column specification level.
     * 
     * @template T Type of a model class that is derived from the `Model`
     * @template Literal Type of a literal who represents the field that is defined in the *T* model
     * @param fieldLike Name of the target field in the model class. The field name can contain
     *                  the table alias.
     * @param alias Alias of the target column
     * @return The exact column name who never can be the runtime error
     */
    public static getColumn<T extends Model, Literal extends SpecialFields<T, Field>>
        (
            this: Model.Creator<T>, 
            fieldLike: `${Literal}` | `${string}.${Literal}`,
            alias?: string | null
        ): string
    {
        return getColumn<T, Literal>(this, fieldLike, alias);
    }

    /**
     * Get arguments for the where-equal query.
     * 
     * `Model.getWhereArguments()` is a static method returning arguments for the 
     * `TypeORM.SelectQueryBuilder.where()` and similar methods.
     * 
     * Unlike writing parameters of the `TypeORM.SelectQueryBuilder.where()` or similar methods
     * by yourself manullay, who can cause critical runtime error by a mis-typing error, the
     * `Model.getWhereArguments()` can prevent the mis-typing error in the compilation level.
     * 
     * The `Model.getWhereArguments()` even supports the table alias, therefore the table alias
     * addicted column also can take advantage of the compile time validation. In such reason, if
     * you don't ignore error message from the TypeScript error, there can't be any runtime error
     * that is caused by the mis-typing error in the SQL where query level.
     * 
     * @template T Type of a model class that is derived from the `Model`
     * @template Literal Type of a literal who represents the field that is defined in the *T* model
     * @param fieldLike Name of the target field in the model class. The field name can contain
     *                  the table alias.
     * @param param A parameter for the where-equal query
     * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods,
     *         which never can be the runtime error
     */
    public static getWhereArguments<T extends Model, Literal extends SpecialFields<T, Field>>
        (
            this: Model.Creator<T>,
            fieldLike: `${Literal}` | `${string}.${Literal}`,
            param: Field.MemberType<T, Literal> | null
        ): [string, { [key: string]: Field.ValueType<T[Literal]> }];

    /**
     * Get arguments for the where query.
     * 
     * `Model.getWhereArguments()` is a static method returning arguments for the 
     * `TypeORM.SelectQueryBuilder.where()` and similar methods.
     * 
     * Unlike writing parameters of the `TypeORM.SelectQueryBuilder.where()` or similar methods
     * by yourself manullay, who can cause critical runtime error by a mis-typing error, the
     * `Model.getWhereArguments()` can prevent the mis-typing error in the compilation level.
     * 
     * The `Model.getWhereArguments()` even supports the table alias, therefore the table alias
     * addicted column also can take advantage of the compile time validation. In such reason, if
     * you don't ignore error message from the TypeScript error, there can't be any runtime error
     * that is caused by the mis-typing error in the SQL where query level.
     * 
     * @template T Type of a model class that is derived from the `Model`
     * @template Literal Type of a literal who represents the field that is defined in the *T* model
     * @param fieldLike Name of the target field in the model class. The field name can contain
     *                  the table alias.
     * @param operator Operator for the where condition
     * @param param A parameter for the where query
     * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods,
     *         which never can be the runtime error
     */
    public static getWhereArguments<T extends Model, 
            Literal extends SpecialFields<T, Field>,
            OperatorType extends Operator>
        (
            this: Model.Creator<T>,
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
     * Unlike writing parameters of the `TypeORM.SelectQueryBuilder.where()` or similar methods
     * by yourself manullay, who can cause critical runtime error by a mis-typing error, the
     * `Model.getWhereArguments()` can prevent the mis-typing error in the compilation level.
     * 
     * The `Model.getWhereArguments()` even supports the table alias, therefore the table alias
     * addicted column also can take advantage of the compile time validation. In such reason, if
     * you don't ignore error message from the TypeScript error, there can't be any runtime error
     * that is caused by the mis-typing error in the SQL where query level.
     * 
     * @template T Type of a model class that is derived from the `Model`
     * @template Literal Type of a literal who represents the field that is defined in the *T* model
     * @param fieldLike Name of the target field in the model class. The field name can contain
     *                  the table alias.
     * @param operator Operator "BETWEEN" for the where condition
     * @param parameters Parameters for the where-in query
     */
    public static getWhereArguments<
            T extends Model, 
            Literal extends SpecialFields<T, Field>>
        (
            this: Model.Creator<T>,
            fieldLike: `${Literal}` | `${string}.${Literal}`,
            operator: "IN",
            parameters: Array<Field.MemberType<T, Literal>>,
        ): [string, { [key: string]: Array<Field.ValueType<T[Literal]>> }];
    
    /**
     * Get arguments for the where-between query.
     * 
     * `Model.getWhereArguments()` is a static method returning arguments for the 
     * `TypeORM.SelectQueryBuilder.where()` and similar methods.
     * 
     * Unlike writing parameters of the `TypeORM.SelectQueryBuilder.where()` or similar methods
     * by yourself manullay, who can cause critical runtime error by a mis-typing error, the
     * `Model.getWhereArguments()` can prevent the mis-typing error in the compilation level.
     * 
     * The `Model.getWhereArguments()` even supports the table alias, therefore the table alias
     * addicted column also can take advantage of the compile time validation. In such reason, if
     * you don't ignore error message from the TypeScript error, there can't be any runtime error
     * that is caused by the mis-typing error in the SQL where query level.
     * 
     * @template T Type of a model class that is derived from the `Model`
     * @template Literal Type of a literal who represents the field that is defined in the *T* model
     * @param fieldLike Name of the target field in the model class. The field name can contain
     *                  the table alias.
     * @param operator Operator "BETWEEN" for the where condition
     * @param minimum Minimum parameter of the between range
     * @param maximum Maximum parameter of the between range
     * @return The exact arguments, for the `TypeORM.SelectQueryBuilder.where()` like methods,
     *         which never can be the runtime error
     */
    public static getWhereArguments<
            T extends Model, 
            Literal extends SpecialFields<T, Field>>
        (
            this: Model.Creator<T>,
            fieldLike: `${Literal}` | `${string}.${Literal}`,
            operator: "BETWEEN",
            minimum: Field.MemberType<T, Literal>,
            maximum: Field.MemberType<T, Literal>
        ): [string, { [key: string]: Array<Field.ValueType<T[Literal]>> }];

    public static getWhereArguments<T extends Model, Literal extends SpecialFields<T, Field>>
        (
            this: Model.Creator<T>,
            fieldLike: `${Literal}` | `${string}.${Literal}`,
            ...rest: any[]
        ): [string, any]
    {
        return getWhereArguments(this, fieldLike, ...(rest as [ Operator, Field.MemberType<T, Literal> ]));
    }

    /* -----------------------------------------------------------
        DESERIALIZER
    ----------------------------------------------------------- */
    /**
     * Convert to the primitive object.
     * 
     * @return The primitive object
     */
    public toPrimitive(): Primitive<this>;

    /**
     * Convert to the primitive object with special ommissions.
     * 
     * @param omits Fields to be ommitted
     * @return The primitive object with ommission
     */
    public toPrimitive<OmitField extends keyof Primitive<this>>
        (...omits: OmitField[]): OmitNever<Omit<Primitive<this>, OmitField>>;

    public toPrimitive<OmitField extends keyof Primitive<this>>
        (...omits: OmitField[]): OmitNever<Omit<Primitive<this>, OmitField>>
    {
        return toPrimitive(this, ...omits);
    }
}

export namespace Model
{
    /**
     * Creator type of a model class.
     * 
     * @template T Type of the target class that is derived from the {@link Model}
     */
    export type Creator<T extends Model> = _Creator<T> & typeof Model;
}