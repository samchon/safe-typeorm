import { OutOfRange } from "tstl/exception/OutOfRange";
import * as orm from "typeorm";

import { Creator } from "../typings/Creator";

import { MapUtil } from "../utils/MapUtil";

export function findRepository<T extends object>(
    creator: Creator<T>,
): orm.Repository<T> {
    return MapUtil.take(memory, creator, () => {
        for (const connection of orm.getConnectionManager().connections)
            if (connection.hasMetadata(creator))
                return connection.getRepository(creator);
        throw new OutOfRange(
            `Error on safe.findRepository(): unable to find the matched repository of the "${creator.name}".`,
        );
    });
}
const memory: WeakMap<Creator<any>, orm.Repository<any>> = new WeakMap();
