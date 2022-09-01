import { DomainError } from "tstl/exception/DomainError";
import * as orm from "typeorm";

import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";
import { ReflectAdaptor } from "../decorators/base/ReflectAdaptor";
import { RelationshipVariable } from "../decorators/base/RelationshipVariable";

import { ITableInfo } from "../functional/internal/ITableInfo";

import { Creator } from "../typings/Creator";
import { Relationship } from "../typings/Relationship";
import { SpecialFields } from "../typings/SpecialFields";

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
 * @reference [stackoverflow/join-queries-vs-multiple-queries](https://stackoverflow.com/questions/1067016/join-queries-vs-multiple-queries)
 * @author Jeongho Nam - https://github.com/samchon
 */
export class JoinQueryBuilder<Mine extends object> {
    private readonly stmt_: orm.SelectQueryBuilder<any>;
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
     * Default Constructor.
     *
     * @param stmt A {@link SelectQueryBuilder} instance for the *Mine* entity
     * @param mine Target ORM class to perform the DB join
     * @param alias Alias name specification, for the *Mine* entity, if required
     */
    public constructor(
        stmt: orm.SelectQueryBuilder<any>,
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
                      Relationship.Joinable.TargetType<Mine, Field>
                  >,
              ) => void)
            | undefined,
        joiner: (asset: IAsset<Mine, Field>) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>> {
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
        RAW JOIN
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
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>>;

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
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>>;

    public innerJoin<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias?:
            | string
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>
                  >,
              ) => void),
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>> {
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
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>>;

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
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>>;

    public leftJoin<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias?:
            | string
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>
                  >,
              ) => void),
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>> {
        return this._Join_atomic(
            "leftJoin",
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
                      Relationship.Joinable.TargetType<Mine, Field>
                  >,
              ) => void)
            | undefined,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>> {
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
            this.stmt_[method](asset.metadata.target(), asset.alias, condition);
        });
    }

    /* -----------------------------------------------------------
        ORM JOIN
    ----------------------------------------------------------- */
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
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>>;

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
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>>;

    public innerJoinAndSelect<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias?:
            | string
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>
                  >,
              ) => void),
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>> {
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
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>>;

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
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>>;

    public leftJoinAndSelect<
        Field extends SpecialFields<Mine, Relationship.Joinable<any>>,
    >(
        field: Field,
        alias?:
            | string
            | ((
                  builder: JoinQueryBuilder<
                      Relationship.Joinable.TargetType<Mine, Field>
                  >,
              ) => void),
        closure?: (
            builder: JoinQueryBuilder<
                Relationship.Joinable.TargetType<Mine, Field>
            >,
        ) => void,
    ): JoinQueryBuilder<Relationship.Joinable.TargetType<Mine, Field>> {
        return this._Join_and_select(
            "leftJoinAndSelect",
            field,
            ...get_parametric_tuple(alias, closure),
        );
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
                      Relationship.Joinable.TargetType<Mine, Field>
                  >,
              ) => void)
            | undefined,
    ) {
        return this._Take_join(method, field, alias, closure, (asset) => {
            const index: string = RelationshipVariable.getter(
                asset.belongs ? "belongs" : "has",
                field,
            );
            this.stmt_[method](`${this.alias_}.${index}`, asset.alias);
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

interface IJoined {
    method: IJoined.Method;
    alias: string;
    builder: JoinQueryBuilder<any>;
}
namespace IJoined {
    export type Method =
        | "innerJoin"
        | "leftJoin"
        | "innerJoinAndSelect"
        | "leftJoinAndSelect";
}
