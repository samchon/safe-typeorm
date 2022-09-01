import * as orm from "typeorm";

import { JoinQueryBuilder } from "../builders/JoinQueryBuilder";

import { Creator } from "../typings/Creator";

import { findRepository } from "./findRepository";

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
export function createJoinQueryBuilder<T extends object>(
    creator: Creator<T>,
    closure: (builder: JoinQueryBuilder<T>) => void,
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
export function createJoinQueryBuilder<T extends object>(
    manager: orm.EntityManager,
    creator: Creator<T>,
    closure: (builder: JoinQueryBuilder<T>) => void,
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
export function createJoinQueryBuilder<T extends object>(
    creator: Creator<T>,
    alias: string,
    closure: (builder: JoinQueryBuilder<T>) => void,
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
export function createJoinQueryBuilder<T extends object>(
    manager: orm.EntityManager,
    creator: Creator<T>,
    alias: string,
    closure: (builder: JoinQueryBuilder<T>) => void,
): orm.SelectQueryBuilder<T>;

export function createJoinQueryBuilder<T extends object>(
    ...args: any[]
): orm.SelectQueryBuilder<T> {
    // LIST UP PARAMETERS
    const manager: orm.EntityManager | null =
        args[0] instanceof orm.EntityManager ? args[0] : null;
    const creator: Creator<T> = manager !== null ? args[1] : args[0];
    args.splice(0, manager !== null ? 2 : 1);

    // LIST UP ALIAS AND CLOSURE
    const [alias, closure]: [string, (builder: JoinQueryBuilder<T>) => void] =
        args.length === 1 ? [creator.name, args[0]] : [args[0], args[1]];

    const stmt: orm.SelectQueryBuilder<T> = (
        manager !== null
            ? manager.getRepository(creator)
            : findRepository(creator)
    ).createQueryBuilder(alias);
    const builder: JoinQueryBuilder<T> = new JoinQueryBuilder(stmt, creator);

    closure(builder);
    return stmt;
}
