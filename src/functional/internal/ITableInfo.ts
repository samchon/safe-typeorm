import { DomainError } from "tstl";
import * as orm from "typeorm";
import { Creator } from "../../typings";

export interface ITableInfo
    {
        name: string;
        primaryColumn: string;
        uuid: boolean;
        incremental: boolean;
        createDateColumn?: string;
        updateDateColumn?: string;
    }

export namespace ITableInfo
{
    const DICT: WeakMap<Creator<object>, ITableInfo> = new WeakMap();

    export function get(creator: Creator<object>): ITableInfo
    {
        let info: ITableInfo | undefined = DICT.get(creator);
        if (info !== undefined)
            return info;

        const metadata = orm.getManager().getRepository(creator).metadata;
        if (metadata.primaryColumns.length !== 1)
            throw new DomainError("Error on ITableInfo.get(): number of primary columns is not one.");

        const primary = metadata.primaryColumns[0];

        info = {
            name: metadata.tableName,
            primaryColumn: primary.propertyName,
            uuid: primary.generationStrategy === "uuid",
            incremental: primary.generationStrategy === "increment",
            createDateColumn: metadata.createDateColumn?.propertyName,
            updateDateColumn: metadata.updateDateColumn?.propertyName,
        };
        DICT.set(creator, info);
        return info;
    }
}