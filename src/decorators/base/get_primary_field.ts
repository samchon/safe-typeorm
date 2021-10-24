import * as orm from "typeorm";
import { Creator } from "../../typings/Creator";

export function get_primary_field
    (
        method: string, 
        target: Creator<any>
    ): string
{
    const columns = orm.getRepository(target).metadata.primaryColumns;
    if (columns.length !== 1)
        throw new Error(`Error on @safe.${method}(): number of columns composing primary key of the ${target} table is not 1 but ${columns.length}.`);

    return columns[0].databaseName;
}