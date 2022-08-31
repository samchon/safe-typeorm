import { VariadicSingleton } from "tstl";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import * as orm from "typeorm";
import { v4 } from "uuid";

import { Creator } from "../typings";
import { findRepository } from "./findRepository";
import { ITableInfo } from "./internal/ITableInfo";

export function insert<T extends object>(
    records: T | T[],
    ignore?: string | boolean,
): Promise<void>;
export function insert<T extends object>(
    manager: orm.EntityManager,
    records: T | T[],
    ignore?: string | boolean,
): Promise<void>;

export async function insert<T extends object>(...args: any[]): Promise<void> {
    if (args[0] instanceof orm.EntityManager) await (_Insert as any)(...args);
    else {
        const elem: T = args[0] instanceof Array ? args[0][0] : args[0];
        await findRepository(elem.constructor as any).manager.transaction(
            (manager) => _Insert(manager, args[0], (args as any)[1]),
        );
    }
}

async function _Insert<T extends object>(
    manager: orm.EntityManager,
    records: T | T[],
    ignore?: string | boolean,
): Promise<void> {
    if (ignore === undefined) ignore = false;
    if (!(records instanceof Array)) records = [records];
    else if (records.length === 0) return;

    const creator: Creator<T> = records[0].constructor as Creator<T>;
    const info: ITableInfo = ITableInfo.get(
        records[0].constructor as Creator<T>,
    );
    if (info.incremental === true)
        throw new InvalidArgument(
            "Error on safe.insert(): primary key of the target table is incremental.",
        );

    const time: Date = new Date();
    for (const rec of records) {
        const elem: any = rec;
        if (!elem[info.primaryColumn]) elem[info.primaryColumn] = v4();
        if (info.createDateColumn) elem[info.createDateColumn] = time;
        if (info.updateDateColumn) elem[info.updateDateColumn] = time;
    }

    const stmt: orm.InsertQueryBuilder<T> = manager
        .getRepository(creator)
        .createQueryBuilder()
        .insert()
        .values(records)
        .updateEntity(false);

    const type = dbms.get(manager);
    if (
        typeof ignore === "boolean" ||
        (type !== "postgres" && type !== "aurora-data-api-pg")
    )
        stmt.orIgnore(ignore);
    else stmt.onConflict(ignore);

    await stmt.execute();
}

const dbms = new VariadicSingleton(
    (manager: orm.EntityManager) => manager.connection.options.type,
);
