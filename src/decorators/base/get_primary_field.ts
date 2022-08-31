import { findRepository } from "../../functional/findRepository";

import { Creator } from "../../typings/Creator";

/**
 * @internal
 */
export function get_primary_field(target: Creator<any>): string {
    const columns = findRepository(target).metadata.primaryColumns;
    if (columns.length !== 1)
        throw new Error(
            `Error on @safe.decorators.base.get_primary_field(): number of columns composing primary key of the "${target}" table is not 1 but ${columns.length}.`,
        );

    return columns[0].databaseName;
}
