import * as orm from "typeorm";

import * as functional from "./functional";
import { JoinQueryBuilder } from "./JoinQueryBuilder";
import { EncryptedColumn } from "./decorators/EncryptedColumn";
import { Has } from "./decorators/Has";

import { Creator as _Creator } from "./typings/Creator";
import { Field } from "./typings/Field";
import { Initialized } from "./typings/Initialized";
import { OmitNever } from "./typings/OmitNever";
import { Operator } from "./typings/Operator";
import { SpecialFields } from "./typings/SpecialFields";

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
        return functional.initialize(this, input);
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
        const columnList = orm.getRepository(this.constructor).metadata.columns;
        const props: any = {};
        
        for (const column of columnList)
        {
            const key: string = column.propertyName;
            props[key] = (this as any)[key];
        }

        const field: string = Has.getPrimaryField(`${this.constructor.name}.update`, this.constructor as any);
        const helper: orm.EntityManager = (manager !== undefined ? manager : orm) as orm.EntityManager;

        await helper.getRepository(this.constructor).update((this as any)[field], props);
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
        return functional.createJoinQueryBuilder(this, ...(args as [string, (builder: JoinQueryBuilder<T>) => void]));
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
        return functional.getColumn<T, Literal>(this, fieldLike, alias);
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
        return functional.getWhereArguments(this, fieldLike, ...(rest as [ Operator, Field.MemberType<T, Literal> ]));
    }

    /* -----------------------------------------------------------
        DESERIALIZER
    ----------------------------------------------------------- */
    /**
     * Convert to the primitive object.
     * 
     * @return The primitive object
     */
    public toPrimitive(): Model.Primitive<this>;

    /**
     * Convert to the primitive object with special ommissions.
     * 
     * @param omits Fields to be ommitted
     * @return The primitive object with ommission
     */
    public toPrimitive<OmitField extends keyof Model.Primitive<this>>
        (...omits: OmitField[]): OmitNever<Omit<Model.Primitive<this>, OmitField>>;

    public toPrimitive(...omits: string[]): object
    {
        if (Model.to_primitive_omit_dicts_.has(this.constructor as Model.Creator<this>) === false)
        {
            const dict: Set<string> = new Set();
            const metadata: orm.EntityMetadata = orm.getRepository(this.constructor).metadata;

            for (const foreign of metadata.foreignKeys)
                for (const column of foreign.columns)
                {
                    const property: string = column.propertyName;
                    if (dict.has(property) === true)
                        continue;

                    const primary = metadata.primaryColumns.find(elem => elem.propertyName === property);
                    if (primary === undefined)
                        dict.add(property);
                }
            Model.to_primitive_omit_dicts_.set(this.constructor as Model.Creator<this>, dict);
        }

        const omitDict: Set<string> = Model.to_primitive_omit_dicts_.get(this.constructor as Model.Creator<this>)!;
        const ret: Record<string, any> = {};

        for (const tuple of Object.entries(this))
        {
            const key: string = tuple[0];
            if (omitDict.has(key) === true)
                continue;
            else if (omits && omits.find(str => str === key) !== undefined)
                continue;

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

    private static readonly to_primitive_omit_dicts_: WeakMap<Model.Creator<any>, Set<string>> = new WeakMap();
}

export namespace Model
{
    /**
     * Creator type of a model class.
     * 
     * @template T Type of the target class that is derived from the {@link Model}
     */
    export type Creator<T extends Model> = _Creator<T> & typeof Model;

    /**
     * @template T Type of a derived class from the {@link Model}
     * @return The new interface type that only pritimive properties are left
     */
    export type Primitive<T extends Model> = OmitNever<
    {
        [P in keyof T]: T[P] extends (number|string|boolean|Date|null)
            ? T[P] extends Date
                ? string
                : T[P] extends (Date|null) 
                    ? (string|null)
                    : T[P]
            : never;
    }>;

    export type IProps<T extends Model> = Initialized<T>;
}