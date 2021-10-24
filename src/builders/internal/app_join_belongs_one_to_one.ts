import { Belongs } from "../../decorators/Belongs";
import { Creator } from "../../typings/Creator";
import { ITableInfo } from "../../functional/internal/ITableInfo";

import { IAppJoinChildTuple } from "./IAppJoinChildTuple";
import { get_records_by_where_in } from "./get_records_by_where_in";

/**
 * @internal
 */
export async function app_join_belongs_one_to_one
    (
        child: IAppJoinChildTuple<any, Belongs.ManyToOne.IMetadata<any> | Belongs.OneToOne.IMetadata<any>>,
        data: any[], 
        field: any,
    ): Promise<any[]>
{
    // NO DATA
    if (data.length === 0)
        return [];

    // NO REFERENCE
    const idList: any[] = data
        .map(elem => elem[field].id)
        .filter(id => id !== null);
    if (idList.length === 0)
        return [];

    // THE TARGET INFO
    const target: Creator<any> = child.metadata.target();
    const table: ITableInfo = ITableInfo.get(target);
    const isOneToOne: boolean = child.metadata.type === "Belongs.OneToOne";

    // LOAD TARGET DATA
    const output: any[] = await get_records_by_where_in(target, table.primaryColumn, idList);

    // LINK RELATIONSHIPS
    const dict: Map<any, any> = new Map(output.map(elem => [ elem[table.primaryColumn], elem ]));
    for (const elem of data)
    {
        const id: any | null = elem[field].id;
        if (id === null)
            continue;

        const reference: any = dict.get(id)!;
        await elem[field].set(reference);

        if (isOneToOne === true && child.metadata.inverse !== null)
            await reference[child.metadata.inverse].set(elem);
    }
    return output;
}
