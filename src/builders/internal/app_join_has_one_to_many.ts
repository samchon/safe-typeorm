import { Pair } from "tstl/utility/Pair";

import { Creator } from "../../typings/Creator";
import { Has } from "../../decorators/Has";
import { SpecialFields } from "../../typings/SpecialFields";
import { ITableInfo } from "../../functional/internal/ITableInfo";

import { get_records_by_where_in } from "./get_records_by_where_in";
import { Belongs } from "../../decorators";

/**
 * @internal
 */
export async function app_join_has_one_to_many<
        Mine extends object,
        Target extends object,
        Field extends SpecialFields<Mine, Has.OneToMany.IMetadata<Target> | Has.External.OneToMany<Target>>>
    (
        mine: Creator<Mine>,
        metadata: Has.OneToMany.IMetadata<Target> | Has.External.OneToMany.IMetadata<Target>,
        myData: Mine[],
        field: Field,
        targetData?: Target[]
    ): Promise<any[]>
{
    if (myData.length === 0)
        return [];

    // INFO
    const target: Creator<Target> = metadata.target();
    const myTable: ITableInfo = ITableInfo.get(mine);
    
    // LOAD TARGET DATA
    const myDict: Map<any, Pair<Mine, Target[]>> = new Map(myData.map(elem => [
        (elem as any)[myTable.primaryColumn],
        new Pair(elem, [])
    ]))
    const myIdList: any[] = myData.map(rec => (rec as any)[myTable.primaryColumn]);
    const output: Target[] 
        = targetData
        || await get_records_by_where_in(target, metadata.inverse, myIdList);

    // LINK RELATIONSHIPS
    for (const targetRecord of output)
    {
        const inverse: Belongs.ManyToOne<Mine, any> = (targetRecord as any)[metadata.inverse];
        const tuple: Pair<Mine, Target[]> | undefined = myDict.get(inverse.id);

        if (tuple === undefined)
            continue;

        tuple.second.push(targetRecord);
        await inverse.set(tuple.first);
    }
    for (const tuple of myDict.values())
    {
        if (metadata.comparator)
            tuple.second = tuple.second.sort(metadata.comparator);
        await (<any>tuple.first[field] as Has.OneToMany<Target>).set(tuple.second);
    }

    // RECURSIVE
    if (<any>target === mine && targetData === undefined)
    {
        const surplus: Target[] = await app_join_has_one_to_many
        (
            mine, 
            metadata, 
            <any>output as Mine[], 
            field
        );
        output.push(...surplus);
    }
    return output;
}