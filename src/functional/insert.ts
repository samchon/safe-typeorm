import * as orm from "typeorm";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { v4 } from "uuid";

import { Creator } from "../typings";
import { ITableInfo } from "./internal/ITableInfo";

export function insert<T extends object>(records: T | T[]): Promise<void>;
export function insert<T extends object>(manager: orm.EntityManager, records: T | T[]): Promise<void>;

export async function insert<T extends object>
    (...args: [T|T[]] | [orm.EntityManager, T|T[]]): Promise<void>
{
    if (args.length === 1)
        await orm.getManager().transaction
        (
            manager => _Insert(manager, args[0])
        );
    else
        await _Insert(...args);
}

async function _Insert<T extends object>
    (manager: orm.EntityManager, records: T | T[]): Promise<void>
{
    if (!(records instanceof Array))
        records = [records];
    else if (records.length === 0)
        return;

    const creator: Creator<T> = records[0].constructor as Creator<T>;
    const info: ITableInfo = ITableInfo.get(records[0].constructor as Creator<T>);
    if (info.incremental === true)
        throw new InvalidArgument("Error on safe.insert(): primary key of the target table is incremental.");

    const time: Date = new Date();
    for (const rec of records)
    {
        const elem: any = rec;
        if (!elem[info.primaryColumn])
            elem[info.primaryColumn] = v4();
        if (info.createDateColumn)
            elem[info.createDateColumn] = time;
        if (info.updateDateColumn)
            elem[info.updateDateColumn] = time;
    }
    await manager.getRepository(creator)
        .createQueryBuilder()
        .insert()
        .values(records)
        .updateEntity(false)
        .execute();
}