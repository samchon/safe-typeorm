import { DomainError } from "tstl/exception/DomainError";
import { OutOfRange } from "tstl/exception/OutOfRange";
import * as orm from "typeorm";

import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";
import { ReflectAdaptor } from "../decorators/base/ReflectAdaptor";
import { RelationshipVariable } from "../decorators/base/RelationshipVariable";

import { ITableInfo } from "../functional/internal/ITableInfo";

import { Creator } from "../typings/Creator";
import { Field } from "../typings/Field";
import { Relationship } from "../typings/Relationship";
import { SpecialFields } from "../typings/SpecialFields";

import { getWhereArguments } from "../functional";
import { FieldLike, Operator } from "../typings";

/**
 * DB level join query builder.
 *
 * `JoinQueryBuilder` is a helper class who can perform the DB level join very
 * conveniently and safely.
 *
 * When you are building up an `JoinQueryBuilder` instance from a specific ORM class,
 * the `JoinQueryBuilder` would analyze relationships of the target ORM class in the
 * compilation level. Therefore, if you take any mistake, it would be detected in the
 * IDE directly. Also, when you're finding neighbor entities to join, `JoinQueryBuilder`
 * will hint you through the auto-completion.
 *
 * ![Hints by the Auto Completion](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/demonstrations/safe-query-builder.gif)
 *
 * Therefore, you don't need to write any raw SQL join query of the TypeORM more. You
 * don't need to suffer from the run-time join SQL error of the TypeORM more. Just
 * replace the join queries to use this `JoinQueryBuilder` instance and feel free from
 * those pains.
 *
 * Also, if you want to perform the DB level join query not to specifying (a) specific
 * record(s) (through where condition from the neighborhood entity) but to combine data,
 * I recommend you to use {@link AppJoinBuilder} or {@link JsonSelectBuilder} rather
 * than this `JoinQueryBuilder`. It's the reason why the application level join
 * consumes much fewer resource and elapses much shorter time.
 *
 * Type         | DB Join   | App Join
 * :------------|----------:|----------:
 * Records      | 2,258,000 | 165
 * Elapsed Time | 8.07508   | 0.00262
 *
 * @template Mine Target entity to perform the DB join
 * @template Query Target entity of `TypeORM.SelectQueryBuilder`
 * @reference [stackoverflow/join-queries-vs-multiple-queries](https://stackoverflow.com/questions/1067016/join-queries-vs-multiple-queries)
 * @author Jeongho Nam - https://github.com/samchon
 */
export class JoinQueryBuilder<Mine extends object, Query extends object = any> {
    private readonly stmt_: IStatement<Query>;
    private readonly mine_: Creator<Mine>;
    private readonly alias_: string;

    private readonly joined_: Map<
        SpecialFields<Mine, Relationship.Joinable<any>>,
        IJoined
    >;

    /* -----------------------------------------------------------
        CONNSTRUCTOR
    ----------------------------------------------------------- */
    /**
     * @internal
     */
    public static create<Mine extends object, Query extends object>(
        stmt: orm.SelectQueryBuilder<Query>,
        mine: Creator<Mine>,
        alias?: string,
    ): JoinQueryBuilder<Mine, Query> {
        return new JoinQueryBuilder(
            {
                query: stmt,
                groupped: false,
                ordered: false,
                selected: false,
            },
            mine,
            alias,
        );
    }

    /**
     * @hidden
     */
    private constructor(
        stmt: IStatement<Query>,
        mine: Creator<Mine>,
        alias?: string,
    ) {
        this.stmt_ = stmt;
        this.mine_ = mine;
        this.alias_ = alias === undefined ? mine.name : alias;
        this.joined_ = new Map();
    }

    private _Take_join<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        method: IJoined.Method,
        field: SpecialFields<Mine, Relationship.Joinable<any>>,
        alias: string | undefined,
        closure:
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>,
                      Query
                  >,
              ) => void)
            | undefined,
        joiner: (asset: IAsset<Mine, Field>) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query> {
        // PREPARE ASSET
        const asset: IAsset<Mine, Field> = prepare_asset(
            this.mine_,
            field,
            alias,
        );

        // CHECK OLDBIE
        const oldbie: IJoined | undefined = this.joined_.get(field);
        if (oldbie !== undefined) {
            if (method !== oldbie.method)
                throw new DomainError(
                    `Error on safe.JoinQueryBuilder.${method}(): ${this.mine_.name}.${field} already has been joined by ${oldbie.method}().`,
                );
            else if (asset.alias !== oldbie.alias)
                throw new DomainError(
                    `Error on safe.JoinQueryBuilder.${method}(): ${this.mine_.name}.${field} already has been joined with another alias "${oldbie.alias}".`,
                );
            return oldbie.builder;
        }

        // DO JOIN
        joiner(asset);

        // BUILDER
        const builder = new JoinQueryBuilder(
            this.stmt_,
            asset.metadata.target(),
            asset.alias,
        );
        this.joined_.set(field, { method, alias: asset.alias, builder });

        if (closure) closure(builder);
        return builder;
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    public has(
        field: SpecialFields<Mine, Relationship.Joinable<any>>,
    ): boolean {
        return this.joined_.has(field);
    }

    public get<Field extends SpecialFields<Mine, Relationship.Joinable<any>>>(
        field: Field,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query> {
        const found: IJoined | undefined = this.joined_.get(field);
        if (found === undefined)
            throw new OutOfRange(
                `Error on safe.JoinQueryBuilder.get(): unable to find the matched key - "${field}".`,
            );
        return found.builder;
    }

    public size(): number {
        return this.joined_.size;
    }

    public empty(): boolean {
        return this.size() === 0;
    }

    public statement(): orm.SelectQueryBuilder<Query> {
        return this.stmt_.query;
    }

    /* -----------------------------------------------------------
        STATEMENTS
    ----------------------------------------------------------- */
    private _Decompose_field_like<Literal extends SpecialFields<Mine, Field>>(
        fieldLike: FieldLike<Literal>,
    ): { column: string; symbol: string } {
        const escape = (field: Literal) =>
            (
                ReflectAdaptor.get(
                    this.mine_.prototype,
                    field,
                ) as Belongs.ManyToOne.IMetadata<any>
            )?.foreign_key_field || field;
        const symbol = (column: string) => `${this.alias_}.${column}`;

        if (typeof fieldLike === "string") {
            const column: string = escape(fieldLike);
            return { column, symbol: symbol(column) };
        } else {
            const column: string = escape(fieldLike[0]);
            const closure: (str: string) => string = fieldLike[1];

            return {
                column,
                symbol: closure(symbol(column)),
            };
        }
    }

    public addSelect<Literal extends SpecialFields<Mine, Field>>(
        fieldLike: FieldLike<Literal>,
        alias?: string,
    ): this {
        const { column, symbol } = this._Decompose_field_like(fieldLike);
        alias ||= column;

        if (this.stmt_.selected === false) {
            this.stmt_.query.select(symbol, alias);
            this.stmt_.selected = true;
        } else {
            this.stmt_.query.addSelect(symbol, alias || column);
        }
        return this;
    }

    public addOrderBy<Literal extends SpecialFields<Mine, Field>>(
        fieldLike: FieldLike<Literal>,
        order?: "ASC" | "DESC" | undefined,
        nulls?: "NULLS FIRST" | "NULLS LAST",
    ): JoinQueryBuilder<Mine, Query> {
        const { symbol } = this._Decompose_field_like(fieldLike);
        if (this.stmt_.ordered === false) {
            this.stmt_.query.orderBy(symbol, order, nulls);
            this.stmt_.ordered = true;
        } else {
            this.stmt_.query.addOrderBy(symbol, order, nulls);
        }
        return this;
    }

    public addGroupBy<Literal extends SpecialFields<Mine, Field>>(
        fieldLike: FieldLike<Literal>,
    ): JoinQueryBuilder<Mine, Query> {
        const { symbol } = this._Decompose_field_like(fieldLike);
        if (this.stmt_.groupped === false) {
            this.stmt_.query.groupBy(symbol);
            this.stmt_.groupped = true;
        } else {
            this.stmt_.query.addGroupBy(symbol);
        }
        return this;
    }

    public andWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
    >(
        this: JoinQueryBuilder<T, Query>,
        field: FieldLike<Literal>,
        param: Field.MemberType<T, Literal> | null | (() => string),
    ): JoinQueryBuilder<Mine, Query>;

    public andWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
        OperatorType extends Operator,
    >(
        this: JoinQueryBuilder<T, Query>,
        field: FieldLike<Literal>,
        operator: OperatorType,
        param:
            | (OperatorType extends "=" | "!=" | "<>"
                  ? Field.MemberType<T, Literal> | null
                  : Field.MemberType<T, Literal>)
            | (() => string),
    ): JoinQueryBuilder<Mine, Query>;

    public andWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
        OperatorType extends Operator,
    >(
        this: JoinQueryBuilder<T, Query>,
        field: FieldLike<Literal>,
        operator: "IN" | "NOT IN",
        param: Array<Field.MemberType<T, Literal>> | (() => string),
    ): JoinQueryBuilder<Mine, Query>;

    public andWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
        OperatorType extends Operator,
    >(
        this: JoinQueryBuilder<T, Query>,
        field: FieldLike<Literal>,
        operator: "BETWEEN",
        minimum: Field.MemberType<T, Literal> | (() => string),
        maximum: Field.MemberType<T, Literal> | (() => string),
    ): JoinQueryBuilder<Mine, Query>;

    public andWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
    >(
        this: JoinQueryBuilder<T, Query>,
        fieldLike: FieldLike<Literal>,
        ...rest: any[]
    ): JoinQueryBuilder<Mine, Query> {
        this._Where(
            (stmt, ...args) => stmt.andWhere(...args),
            fieldLike,
            ...rest,
        );
        return (<any>this) as JoinQueryBuilder<Mine, Query>;
    }

    public orWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
    >(
        this: JoinQueryBuilder<T, Query>,
        field: FieldLike<Literal>,
        param: Field.MemberType<T, Literal> | null | (() => string),
    ): JoinQueryBuilder<Mine, Query>;

    public orWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
        OperatorType extends Operator,
    >(
        this: JoinQueryBuilder<T, Query>,
        field: FieldLike<Literal>,
        operator: OperatorType,
        param:
            | (OperatorType extends "=" | "!=" | "<>"
                  ? Field.MemberType<T, Literal> | null
                  : Field.MemberType<T, Literal>)
            | (() => string),
    ): JoinQueryBuilder<Mine, Query>;

    public orWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
        OperatorType extends Operator,
    >(
        this: JoinQueryBuilder<T, Query>,
        field: FieldLike<Literal>,
        operator: "IN" | "NOT IN",
        param: Array<Field.MemberType<T, Literal>> | (() => string),
    ): JoinQueryBuilder<Mine, Query>;

    public orWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
        OperatorType extends Operator,
    >(
        this: JoinQueryBuilder<T, Query>,
        field: FieldLike<Literal>,
        operator: "BETWEEN",
        minimum: Field.MemberType<T, Literal> | (() => string),
        maximum: Field.MemberType<T, Literal> | (() => string),
    ): JoinQueryBuilder<Mine, Query>;

    public orWhere<
        T extends Mine & { [P in Literal]: Field },
        Literal extends SpecialFields<T, Field>,
    >(
        this: JoinQueryBuilder<T, Query>,
        fieldLike: FieldLike<Literal>,
        ...rest: any[]
    ): JoinQueryBuilder<Mine, Query> {
        this._Where(
            (stmt, ...args) => stmt.orWhere(...args),
            fieldLike,
            ...rest,
        );
        return (<any>this) as JoinQueryBuilder<Mine, Query>;
    }

    private _Where(
        condition: (
            stmt: orm.SelectQueryBuilder<Query>,
            ...args: [string, any]
        ) => any,
        fieldLike: string | [string, (str: string) => string],
        ...rest: any[]
    ) {
        const parameters: any[] = [
            this.mine_,
            typeof fieldLike === "string"
                ? `${this.alias_}.${fieldLike}`
                : [`${this.alias_}.${fieldLike[0]}`, fieldLike[1]],
        ];
        parameters.push(...rest);

        const args: [string, any] = (getWhereArguments as any)(...parameters);
        condition(this.stmt_.query, ...args);
    }

    public getColumn<Literal extends SpecialFields<Mine, Field>>(
        field: Literal,
    ): string {
        const column: string =
            (
                ReflectAdaptor.get(
                    this.mine_.prototype,
                    field,
                ) as Belongs.ManyToOne.IMetadata<Mine>
            )?.foreign_key_field || field;
        return `${this.alias_}.${column}`;
    }

    /* -----------------------------------------------------------
        JOINERS
    ----------------------------------------------------------- */
    /**
     * Configure an inner join.
     *
     * `JoinQueryBuilder.innerJoin()` is a method configuring a neighbor entity to
     * inner join, by specifying an accessor field of the *Mine* class, who've defined
     * the relationship decorator with the target neighbor entity class.
     *
     * You also can configure another DB joining targets of the target neighbor entity
     * by writing *closure* function or calling additional methods to the returned
     * `JoinQueryBuilder` instance for the target neighbor entity. Of course, such DB
     * join definition chaining would also benefic from the compilation type checking
     * and auto-completion hints, too.
     *
     * @param field Field of *Mine* who've defined the relationship decorator to join
     * @param closure Closure function for additional DB joins from the target entity
     * @return New `JoinQueryBuilder` instance for the target entity
     */
    public innerJoin<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query>;

    /**
     * Configure an inner join with alias specification.
     *
     * `JoinQueryBuilder.innerJoin()` is a method configuring a neighbor entity to
     * inner join, by specifying an accessor field of the *Mine* class, who've defined
     * the relationship decorator with the target neighbor entity class.
     *
     * You also can configure another DB joining targets of the target neighbor entity
     * by writing *closure* function or calling additional methods to the returned
     * `JoinQueryBuilder` instance for the target neighbor entity. Of course, such DB
     * join definition chaining would also benefic from the compilation type checking
     * and auto-completion hints, too.
     *
     * @param field Field of *Mine* who've defined the relationship decorator to join
     * @param alias Alias name specification for the target entity
     * @param closure Closure function for additional DB joins from the target entity
     * @return New `JoinQueryBuilder` instance for the target entity
     */
    public innerJoin<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias: string,
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query>;

    public innerJoin<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias?:
            | string
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>,
                      Query
                  >,
              ) => void),
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query> {
        return this._Join_atomic(
            "innerJoin",
            field,
            ...get_parametric_tuple(alias, closure),
        );
    }

    /**
     * Configure left join.
     *
     * `JoinQueryBuilder.leftJoin()` is a method configuring a neighbor entity to
     * left join, by specifying an accessor field of the *Mine* class, who've defined
     * the relationship decorator with the target neighbor entity class.
     *
     * You also can configure another DB joining targets of the target neighbor entity
     * by writing *closure* function or calling additional methods to the returned
     * `JoinQueryBuilder` instance for the target neighbor entity. Of course, such DB
     * join definition chaining would also benefic from the compilation type checking
     * and auto-completion hints, too.
     *
     * @param field Field of *Mine* who've defined the relationship decorator to join
     * @param closure Closure function for additional DB joins from the target entity
     * @return New `JoinQueryBuilder` instance for the target entity
     */
    public leftJoin<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query>;

    /**
     * Configure left join with alias specification.
     *
     * `JoinQueryBuilder.leftJoin()` is a method configuring a neighbor entity to
     * left join, by specifying an accessor field of the *Mine* class, who've defined
     * the relationship decorator with the target neighbor entity class.
     *
     * You also can configure another DB joining targets of the target neighbor entity
     * by writing *closure* function or calling additional methods to the returned
     * `JoinQueryBuilder` instance for the target neighbor entity. Of course, such DB
     * join definition chaining would also benefic from the compilation type checking
     * and auto-completion hints, too.
     *
     * @param field Field of *Mine* who've defined the relationship decorator to join
     * @param alias Alias name specification for the target entity
     * @param closure Closure function for additional DB joins from the target entity
     * @return New `JoinQueryBuilder` instance for the target entity
     */
    public leftJoin<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias: string,
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query>;

    public leftJoin<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias?:
            | string
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>,
                      Query
                  >,
              ) => void),
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query> {
        return this._Join_atomic(
            "leftJoin",
            field,
            ...get_parametric_tuple(alias, closure),
        );
    }

    /**
     * Configure inner join with mapping.
     *
     * `JoinQueryBuilder.innerJoinAndSelect()` is a method configuring a neighbor entity
     * to inner join, by specifying an accessor field of the *Mine* class, who've
     * defined the relationship decorator with the target neighbor entity class.
     *
     * Furthermore, the `JoinQueryBuilder.innerJoinAndSelect()` method memorizes the
     * target entity data to the relationship decorated accessor. However, if you're
     * using this method not to specifying (a) specific record(s) but to combining data,
     * I recommend you to utilize the {@link AppJsonBuilder} class instead.
     *
     * Anyway, you can configure another DB joining targets of the target neighbor
     * entity by writing *closure* function or calling additional methods to the
     * returned `JoinQueryBuilder` instance for the target neighbor entity. Of course,
     * such DB join definition chaining would also benefic from the compilation type
     * checking and auto-completion hints, too.
     *
     * @param field Field of *Mine* who've defined the relationship decorator to join
     * @param closure Closure function for additional DB joins from the target entity
     * @return New `JoinQueryBuilder` instance for the target entity
     */
    public innerJoinAndSelect<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query>;

    /**
     * Configure inner join with mapping and alias specification.
     *
     * `JoinQueryBuilder.innerJoinAndSelect()` is a method configuring a neighbor entity
     * to inner join, by specifying an accessor field of the *Mine* class, who've
     * defined the relationship decorator with the target neighbor entity class.
     *
     * Furthermore, the `JoinQueryBuilder.innerJoinAndSelect()` method memorizes the
     * target entity data to the relationship decorated accessor. However, if you're
     * using this method not to specifying (a) specific record(s) but to combining data,
     * I recommend you to utilize the {@link AppJsonBuilder} class instead.
     *
     * Anyway, you can configure another DB joining targets of the target neighbor
     * entity by writing *closure* function or calling additional methods to the
     * returned `JoinQueryBuilder` instance for the target neighbor entity. Of course,
     * such DB join definition chaining would also benefic from the compilation type
     * checking and auto-completion hints, too.
     *
     * @param field Field of *Mine* who've defined the relationship decorator to join
     * @param alias Alias name specification for the target entity
     * @param closure Closure function for additional DB joins from the target entity
     * @return New `JoinQueryBuilder` instance for the target entity
     */
    public innerJoinAndSelect<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias: string,
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query>;

    public innerJoinAndSelect<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias?:
            | string
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>,
                      Query
                  >,
              ) => void),
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query> {
        return this._Join_and_select(
            "innerJoinAndSelect",
            field,
            ...get_parametric_tuple(alias, closure),
        );
    }

    /**
     * Configure left join with mapping.
     *
     * `JoinQueryBuilder.leftJoinAndSelect()` is a method configuring a neighbor entity
     * to left join, by specifying an accessor field of the *Mine* class, who've
     * defined the relationship decorator with the target neighbor entity class.
     *
     * Furthermore, the `JoinQueryBuilder.leftJoinAndSelect()` method memorizes the
     * target entity data to the relationship decorated accessor. However, if you're
     * using this method not to specifying (a) specific record(s) but to combining data,
     * I recommend you to utilize the {@link AppJsonBuilder} class instead.
     *
     * Anyway, you can configure another DB joining targets of the target neighbor
     * entity by writing *closure* function or calling additional methods to the
     * returned `JoinQueryBuilder` instance for the target neighbor entity. Of course,
     * such DB join definition chaining would also benefic from the compilation type
     * checking and auto-completion hints, too.
     *
     * @param field Field of *Mine* who've defined the relationship decorator to join
     * @param closure Closure function for additional DB joins from the target entity
     * @return New `JoinQueryBuilder` instance for the target entity
     */
    public leftJoinAndSelect<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query>;

    /**
     * Configure left join with mapping and alias specification.
     *
     * `JoinQueryBuilder.leftJoinAndSelect()` is a method configuring a neighbor entity
     * to left join, by specifying an accessor field of the *Mine* class, who've
     * defined the relationship decorator with the target neighbor entity class.
     *
     * Furthermore, the `JoinQueryBuilder.leftJoinAndSelect()` method memorizes the
     * target entity data to the relationship decorated accessor. However, if you're
     * using this method not to specifying (a) specific record(s) but to combining data,
     * I recommend you to utilize the {@link AppJsonBuilder} class instead.
     *
     * Anyway, you can configure another DB joining targets of the target neighbor
     * entity by writing *closure* function or calling additional methods to the
     * returned `JoinQueryBuilder` instance for the target neighbor entity. Of course,
     * such DB join definition chaining would also benefic from the compilation type
     * checking and auto-completion hints, too.
     *
     * @param field Field of *Mine* who've defined the relationship decorator to join
     * @param alias Alias name specification for the target entity
     * @param closure Closure function for additional DB joins from the target entity
     * @return New `JoinQueryBuilder` instance for the target entity
     */
    public leftJoinAndSelect<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias: string,
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query>;

    public leftJoinAndSelect<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias?:
            | string
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>,
                      Query
                  >,
              ) => void),
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>,
                Query
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query> {
        return this._Join_and_select(
            "leftJoinAndSelect",
            field,
            ...get_parametric_tuple(alias, closure),
        );
    }

    private _Join_atomic<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        method: "innerJoin" | "leftJoin",
        field: Field,
        alias: string | undefined,
        closure:
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>,
                      Query
                  >,
              ) => void)
            | undefined,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>, Query> {
        return this._Take_join(method, field, alias, closure, (asset) => {
            // LIST UP EACH FIELDS
            const [myField, targetField] = (() => {
                if (asset.belongs === true)
                    return [
                        asset.metadata.foreign_key_field,
                        get_primary_column(asset.metadata.target()),
                    ];

                const inverseMetadata: Belongs.ManyToOne.IMetadata<Mine> =
                    ReflectAdaptor.get(
                        asset.metadata.target().prototype,
                        asset.metadata.inverse,
                    ) as Belongs.ManyToOne.IMetadata<Mine>;

                return [
                    get_primary_column(this.mine_),
                    inverseMetadata.foreign_key_field,
                ];
            })();

            // DO JOIN
            const condition: string = `${this.alias_}.${myField} = ${asset.alias}.${targetField}`;
            this.stmt_.query[method](
                asset.metadata.target(),
                asset.alias,
                condition,
            );
        });
    }

    private _Join_and_select<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        method: "innerJoinAndSelect" | "leftJoinAndSelect",
        field: Field,
        alias: string | undefined,
        closure:
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>,
                      Query
                  >,
              ) => void)
            | undefined,
    ) {
        return this._Take_join(method, field, alias, closure, (asset) => {
            const index: string = RelationshipVariable.getter(
                asset.belongs ? "belongs" : "has",
                field,
            );
            this.stmt_.query[method](`${this.alias_}.${index}`, asset.alias);
        });
    }
}

type IAsset<
    Mine extends object,
    Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
> =
    | {
          belongs: true;
          alias: string;
          metadata: Belongs.ManyToOne.IMetadata<
              Relationship.Joinable.TargetType<Mine, Field>
          >;
      }
    | {
          belongs: false;
          alias: string;
          metadata: Has.OneToMany.IMetadata<
              Relationship.Joinable.TargetType<Mine, Field>
          >;
      };

function prepare_asset<
    Mine extends object,
    Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
>(
    mine: Creator<Mine>,
    field: Field,
    alias: string | undefined,
): IAsset<Mine, Field> {
    const metadata: ReflectAdaptor.Metadata<
        Relationship.Joinable.TargetType<Mine, Field>
    > = ReflectAdaptor.get(mine.prototype, field)!;
    const belongs: boolean = metadata.type.indexOf("Belongs.") === 0;

    // DETERMINE THE ALIAS
    if (alias === undefined) alias = metadata.target().name;

    // RETURNS
    return {
        belongs: belongs as true,
        metadata: metadata as Belongs.ManyToOne.IMetadata<
            Relationship.Joinable.TargetType<Mine, Field>
        >,
        alias,
    };
}

function get_parametric_tuple<Func extends Function>(
    x?: string | Func,
    y?: Func,
): [string | undefined, Func | undefined] {
    return typeof x === "string" ? [x, y] : [undefined, x];
}

function get_primary_column(creator: Creator<object>): string {
    return ITableInfo.get(creator).primaryColumn;
}

interface IStatement<Query> {
    query: orm.SelectQueryBuilder<Query>;
    selected: boolean;
    groupped: boolean;
    ordered: boolean;
}
interface IJoined {
    method: IJoined.Method;
    alias: string;
    builder: JoinQueryBuilder<any, any>;
}
namespace IJoined {
    export type Method =
        | "innerJoin"
        | "leftJoin"
        | "innerJoinAndSelect"
        | "leftJoinAndSelect";
}
