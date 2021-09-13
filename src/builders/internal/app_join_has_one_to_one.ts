import { Pair } from "tstl/utility/Pair";

import { Creator } from "../../typings/Creator";
import { Has } from "../../decorators/Has";
import { ITableInfo } from "../../functional/internal/ITableInfo";

import { IAppJoinChildTuple } from "./IAppJoinChildTuple";
import { get_records_by_where_in } from "./get_records_by_where_in";

/**
 * @internal
 */
export async function app_join_has_one_to_one
    (
        mine: Creator<any>,
        child: IAppJoinChildTuple<any, Has.OneToOne.IMetadata<any>>,
        data: any[], 
        field: any,
    ): Promise<any[]>
{
    if (data.length === 0)
        return [];

    // MY TABLE & DATA
    const myTable: ITableInfo = ITableInfo.get(mine);
    const myDict: Map<any, Pair<any, any | null>> = new Map(data.map(record => 
    [
        record[myTable.primaryColumn], 
        new Pair(record, null)
    ]));
    const myIdList: any[] = data.map(rec => rec[myTable.primaryColumn]);
    
    // LOAD TARGET DATA
    const target: Creator<any> = child.metadata.target();
    const output: any[] = await get_records_by_where_in(target, child.metadata.inverse, myIdList);

    // LINK RELATIONSHIPS
    for (const targetRecord of output)
    {
        const tuple: any = myDict.get(targetRecord[child.metadata.inverse].id)!;
        tuple.second = targetRecord;
        await targetRecord[child.metadata.inverse].set(tuple.first);
    }
    for (const tuple of myDict.values())
        await tuple.first[field].set(tuple.second);

    // RECURSIVE
    if (target === mine)
        await app_join_has_one_to_one(mine, child, output, field);

    return output;
}