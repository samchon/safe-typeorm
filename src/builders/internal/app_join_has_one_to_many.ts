import { Pair } from "tstl/utility/Pair";

import { Creator } from "../../typings/Creator";
import { Has } from "../../decorators/Has";
import { ITableInfo } from "../../functional/internal/ITableInfo";

import { IAppJoinChildTuple } from "./IAppJoinChildTuple";
import { get_records_by_where_in } from "./get_records_by_where_in";

/**
 * @internal
 */
export async function app_join_has_one_to_many
    (
        mine: Creator<any>,
        child: IAppJoinChildTuple<any, Has.OneToMany.IMetadata<any>>,
        data: any[],
        field: any
    ): Promise<any[]>
{
    if (data.length === 0)
        return [];

    // INFO
    const target: Creator<any> = child.metadata.target();
    const myTable: ITableInfo = ITableInfo.get(mine);
    
    // LOAD TARGET DATA
    const myDict: Map<any, Pair<any, any[]>> = new Map(data.map(elem => [
        elem[myTable.primaryColumn],
        new Pair(elem, [])
    ]))
    const myIdList: any[] = data.map(rec => rec[myTable.primaryColumn]);
    const output: any[] = await get_records_by_where_in(target, child.metadata.inverse, myIdList);

    // LINK RELATIONSHIPS
    for (const targetRecord of output)
    {
        const tuple: Pair<any, any[]> = myDict.get(targetRecord[child.metadata.inverse].id)!;
        tuple.second.push(targetRecord);
        await targetRecord[child.metadata.inverse].set(tuple.first);
    }
    for (const tuple of myDict.values())
    {
        if (child.metadata.comparator)
            tuple.second = tuple.second.sort(child.metadata.comparator);
        await tuple.first[field].set(tuple.second);
    }

    // RECURSIVE
    if (target === mine)
        await app_join_has_one_to_many(mine, child, output, field);

    return output;
}