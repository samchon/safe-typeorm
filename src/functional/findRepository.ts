import * as orm from "typeorm";
import { OutOfRange } from "tstl/exception/OutOfRange";

import { Creator } from "../typings/Creator";

export function findRepository<T extends object>
    (creator: Creator<T>): orm.Repository<T>
{
    let repository: orm.Repository<T> | undefined = memory.get(creator);
    if (repository === undefined)
    {
        for (const connection of orm.getConnectionManager().connections)
        {
            if (connection.hasMetadata(creator))
            {
                repository = connection.getRepository(creator);
                break;
            }
        }
        if (repository === undefined)
            throw new OutOfRange(`Error on safe.findRepository(): unable to find the matched repository of the "${creator.name}".`);
    }
    return repository;
}

const memory: WeakMap<Creator<any>, orm.Repository<any>> = new WeakMap();