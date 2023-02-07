import { HashMap, VariadicSingleton, hash } from "tstl";
import { equal } from "tstl/ranges";
import { Connection } from "typeorm";

import { findRepository } from "../functional/findRepository";

import { Creator } from "../typings/Creator";

/**
 * Utility functions for ORM Entities.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace EntityUtil {
    /* -----------------------------------------------------------
        TABLE INFO
    ----------------------------------------------------------- */
    export interface ITableInfo {
        target: Creator<object>;
        schema: string;
        name: string;
        primary: string;
        uniques: string[][];
        children: ITableInfo.IChild[];
    }
    export namespace ITableInfo {
        export interface IChild {
            info: ITableInfo;
            foreign: string;
        }
    }

    /**
     * Get table name.
     *
     * @param entity Target entity type
     * @returns Table name
     */
    export function name<Entity extends object>(
        entity: Creator<Entity>,
    ): string {
        return findRepository(entity).metadata.tableName;
    }

    /**
     * Get table info.
     *
     * @param entity Target entity type
     * @returns Table info
     */
    export function info<Entity extends object>(
        entity: Creator<Entity>,
    ): ITableInfo {
        const dict: Map<string, ITableInfo> = table_infos_.get(
            findRepository(entity).manager.connection,
        );
        return dict.get(name(entity))!;
    }

    const table_infos_ = new VariadicSingleton((connection: Connection) => {
        const dict: Map<string, ITableInfo> = new Map();
        for (const entity of connection.entityMetadatas) {
            const info: ITableInfo = {
                target: entity.target as Creator<object>,
                schema: entity.schema!,
                name: entity.tableName,
                primary: entity.primaryColumns[0].databaseName,
                uniques: entity.uniques.map((u) =>
                    u.columns.map((c) => c.databaseName),
                ),
                children: [],
            };
            dict.set(info.name, info);
        }
        for (const entity of connection.entityMetadatas) {
            const info: ITableInfo = dict.get(entity.tableName)!;
            const parentTuples: [ITableInfo, string][] = entity.foreignKeys.map(
                (fk) => [
                    dict.get(fk.referencedEntityMetadata.tableName)!,
                    fk.columns[0].databaseName,
                ],
            );
            for (const [parent, foreign] of parentTuples)
                parent.children.push({ info, foreign });
        }
        return dict;
    });

    /* -----------------------------------------------------------
        UNIFIER
    ----------------------------------------------------------- */
    /**
     * Merge duplicate records into one.
     *
     * Absords and merges multiple entity records (*duplicates*) into one (*original*).
     * That is, all records listed in *duplicates* would be erased, and instead,
     * references to entities of all records subordinate to duplicate records would be
     * replaced with original ones.
     *
     * During unification, if there're some children entities dependent on `Entity` and
     * their foreign columns referencing `Entity` are belonged to unique constraint,
     * they would be unified recursively.
     *
     * @template Entity Target entity type
     * @param original Original record to absorb
     * @param duplicates Duplicated records to be absorbed
     */
    export async function unify<Entity extends object>(
        original: Entity,
        duplicates: Entity[],
    ): Promise<void> {
        try {
            const meta: ITableInfo = await info(
                original.constructor as Creator<Entity>,
            );
            const deprecates: string[] = duplicates.map(
                (elem) => (elem as any)[meta.primary],
            );

            await _Unify(meta, (original as any)[meta.primary], deprecates);
        } catch (exp) {
            console.log(exp);
            process.exit(-1);
        }
    }

    async function _Unify(
        table: ITableInfo,
        keep: string,
        deprecates: string[],
    ): Promise<void> {
        if (deprecates.length === 0) return;

        for (const dependency of table.children) {
            const unique: boolean[] = [];
            if (dependency.info.uniques.length !== 0)
                for (const columns of dependency.info.uniques)
                    if (
                        columns.find((col) => col === dependency.foreign) !==
                        undefined
                    ) {
                        unique.push(false);
                        await _Unify_unique_children(
                            keep,
                            deprecates,
                            dependency,
                            columns,
                        );
                    }
            if (unique.length === 0) {
                // UPDATE RECORD DIRECTLY
                await findRepository(dependency.info.target)
                    .createQueryBuilder()
                    .andWhere(`${dependency.foreign} IN (:...deprecates)`, {
                        deprecates,
                    })
                    .update({ [dependency.foreign]: keep })
                    .updateEntity(false)
                    .execute();
            }
        }

        // DELETE THE DUPLICATED RECORDS
        await findRepository(table.target)
            .createQueryBuilder()
            .andWhere(`${table.primary} IN (:...deprecates)`, { deprecates })
            .delete()
            .execute();
    }

    async function _Unify_unique_children(
        keep: string,
        deprecates: string[],
        child: ITableInfo.IChild,
        columns: string[],
    ): Promise<void> {
        const group: string[] = columns.filter((col) => col !== child.foreign);
        if (group.length !== 0) {
            const sql: string = `
                UPDATE ${child.info.schema}.${child.info.name}
                SET ${child.foreign} = $1
                WHERE ${child.info.primary} IN
                (
                    SELECT CAST(MIN(CAST(${
                        child.info.primary
                    } AS VARCHAR(36))) AS UUID) AS ${child.info.primary}
                    FROM ${child.info.schema}.${child.info.name}
                    WHERE ${child.foreign} IN ($1, ${deprecates
                .map((_, index) => `$${index + 2}`)
                .join(", ")})
                    GROUP BY ${group.join(", ")}
                    HAVING COUNT(CASE WHEN ${
                        child.foreign
                    } = $1 THEN 1 ELSE NULL END) = 0
                )`;
            await findRepository(child.info.target).query(sql, [
                keep,
                ...deprecates,
            ]);
        }

        const recordList: (IEntity & any)[] = await findRepository(
            child.info.target,
        ).query(
            `SELECT * 
            FROM ${child.info.schema}.${child.info.name} 
            WHERE ${child.foreign} IN (${[keep, ...deprecates]
                .map((_, index) => `$${index + 1}`)
                .join(", ")})
            ORDER BY ${child.info.primary} ASC`,
            [keep, ...deprecates],
        );

        const dict: HashMap<any[], (IEntity & any)[]> = new HashMap(
            (elements) => hash(...elements),
            (x, y) => equal(x, y),
        );
        for (const record of recordList) {
            const key: any[] = group.map((col) => record[col]);
            const array: (IEntity & any)[] = dict.take(key, () => []);
            array.push(record);
        }

        for (const it of dict) {
            const index: number = it.second.findIndex(
                (rec) => rec[child.foreign] === keep,
            );
            const master: any = it.second[index];
            const slaves: any[] = it.second.filter((_, i) => i !== index);

            await _Unify(
                child.info,
                master[child.info.primary],
                slaves.map((s) => s[child.info.primary]),
            );
        }
    }
}

/**
 * @internal
 */
interface IEntity {
    id: string;
}
