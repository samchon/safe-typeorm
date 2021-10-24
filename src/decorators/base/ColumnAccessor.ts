import * as orm from "typeorm";

import { Creator } from "../../typings/Creator";

export namespace ColumnAccessor
{
    export function helper(type: "has" | "belongs", field: string)
    {
        return `__m_${type}_${field}_helper__`;
    }

    export function getter(type: "has" | "belongs", field: string)
    {
        return `__m_${type}_${field}_getter__`;
    }

    export function primary(target: Creator<any>): string
    {
        const columns = orm.getRepository(target).metadata.primaryColumns;
        if (columns.length !== 1)
            throw new Error(`Error on safe.internal.ColumnAccessor.primary(): number of columns composing primary key of the ${target} table is not 1 but ${columns.length}.`);

        return columns[0].databaseName;
    }
}