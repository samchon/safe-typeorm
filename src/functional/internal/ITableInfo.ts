import { DomainError } from "tstl/exception/DomainError";

import { Creator } from "../../typings";
import { MapUtil } from "../../utils/MapUtil";
import { findRepository } from "../findRepository";

export interface ITableInfo {
    name: string;
    primaryColumn: string;
    uuid: boolean;
    incremental: boolean;
    createDateColumn?: string;
    updateDateColumn?: string;
}

export namespace ITableInfo {
    const DICT: WeakMap<Creator<object>, ITableInfo> = new WeakMap();

    export function get(creator: Creator<object>): ITableInfo {
        return MapUtil.take(DICT, creator, () => {
            const metadata = findRepository(creator).metadata;
            if (metadata.primaryColumns.length !== 1)
                throw new DomainError(
                    `Error on ITableInfo.get(): number of primary columns of "${creator.name}" table is not one.`,
                );

            const primary = metadata.primaryColumns[0];
            return {
                name: metadata.tableName,
                primaryColumn: primary.propertyName,
                uuid: primary.generationStrategy === "uuid",
                incremental: primary.generationStrategy === "increment",
                createDateColumn: metadata.createDateColumn?.propertyName,
                updateDateColumn: metadata.updateDateColumn?.propertyName,
            };
        });
    }
}
