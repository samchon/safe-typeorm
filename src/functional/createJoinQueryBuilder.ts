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
 * @return The newly created `JoinQueryBuilder` instance
 */
export function createJoinQueryBuilder<T extends object>(
    creator: Creator<T>,
    closure?: (builder: JoinQueryBuilder<T, T>) => void,
): JoinQueryBuilder<T, T>;

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
 * @return The newly created `JoinQueryBuilder` instance
 */
export function createJoinQueryBuilder<T extends object>(
    manager: orm.EntityManager,
    creator: Creator<T>,
    closure?: (builder: JoinQueryBuilder<T, T>) => void,
): JoinQueryBuilder<T, T>;

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
 * @return The newly created `JoinQueryBuilder` instance
 */
export function createJoinQueryBuilder<T extends object>(
    creator: Creator<T>,
    alias: string,
    closure?: (builder: JoinQueryBuilder<T, T>) => void,
): JoinQueryBuilder<T, T>;

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
 * @return The newly created `JoinQueryBuilder` instance
 */
export function createJoinQueryBuilder<T extends object>(
    manager: orm.EntityManager,
    creator: Creator<T>,
    alias: string,
    closure?: (builder: JoinQueryBuilder<T, T>) => void,
): JoinQueryBuilder<T, T>;

export function createJoinQueryBuilder<T extends object>(
    ...args: any[]
): JoinQueryBuilder<T, T> {
    // LIST UP PARAMETERS
    const index: number = args[0] instanceof orm.EntityManager ? 1 : 0;

    const manager: orm.EntityManager | null = index === 1 ? args[0] : null;
    const creator: Creator<T> = args[index];
    const alias: string | undefined =
        typeof args[index + 1] === "string" ? args[index + 1] : undefined;
    const closure = alias !== undefined ? args[index + 2] : args[index + 1];

    // STATEMENT
    const stmt: orm.SelectQueryBuilder<T> = (
        manager !== null
            ? manager.getRepository(creator)
            : findRepository(creator)
    ).createQueryBuilder(alias);

    // JOINER
    const builder: JoinQueryBuilder<T, T> = JoinQueryBuilder.create(
        stmt,
        creator,
        alias,
    );
    if (closure) closure(builder);
    return builder;
}
