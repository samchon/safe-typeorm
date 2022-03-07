import { Belongs } from "../../decorators/Belongs";
import { Creator } from "../../typings/Creator";
import { SpecialFields } from "../../typings/SpecialFields";
import { ITableInfo } from "../../functional/internal/ITableInfo";

import { get_records_by_where_in } from "./get_records_by_where_in";
import { IAppJoinChildTuple } from "./IAppJoinChildTuple";

/**
 * @internal
 */
export async function app_join_belongs_many_to_one<
        Mine extends object,
        Target extends object,
        Field extends SpecialFields<Mine, Belongs.ManyToOne<Target, any> | Belongs.External.ManyToOne<Target, any>>>
    (
        mine: Creator<Mine>,
        metadata: Belongs.ManyToOne.IMetadata<Target> | Belongs.External.ManyToOne.IMetadata<Target>,
        myData: Mine[], 
        field: Field,
        options: IAppJoinChildTuple.IOptions<Target>
    ): Promise<Target[]>
{
    // NO DATA
    if (myData.length === 0)
        return [];

    // NO REFERENCE
    const idList: any[] = myData
        .map(elem => (<any>elem[field] as Belongs.ManyToOne<Target, any>).id)
        .filter(id => id !== null);
    if (idList.length === 0)
        return [];

    // THE TARGET INFO
    const target: Creator<Target> = metadata.target();
    const table: ITableInfo = ITableInfo.get(target);

    // LOAD TARGET DATA
    const output: Target[] = options.targetData || 
        await get_records_by_where_in
        (
            target, 
            table.primaryColumn, 
            idList, 
            options.filter
        );

    // LINK RELATIONSHIPS
    const dict: Map<any, any> = new Map(output.map(elem => [ (elem as any)[table.primaryColumn], elem ]));
    for (const elem of myData)
    {
        const accessor = <any>elem[field] as Belongs.ManyToOne<Target, any>;
        if (accessor.id === null)
            continue;

        const reference: any = dict.get(accessor.id)!;
        await accessor.set(reference);
    }

    // RECURSIVE
    if (<any>target === mine && !options.targetData)
    {
        const surplus: Target[] = await app_join_belongs_many_to_one
        (
            mine, 
            metadata, 
            <any>output as Mine[], 
            field,
            options
        );
        output.push(...surplus);
    }
    return output;
}