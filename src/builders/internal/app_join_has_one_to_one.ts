import { Pair } from "tstl/utility/Pair";

import { Has } from "../../decorators/Has";

import { ITableInfo } from "../../functional/internal/ITableInfo";

import { Creator } from "../../typings/Creator";
import { SpecialFields } from "../../typings/SpecialFields";

import { Belongs } from "../../decorators";
import { IAppJoinChildTuple } from "./IAppJoinChildTuple";
import { get_records_by_where_in } from "./get_records_by_where_in";

/**
 * @internal
 */
export async function app_join_has_one_to_one<
    Mine extends object,
    Target extends object,
    Field extends SpecialFields<
        Mine,
        Has.OneToOne.IMetadata<Target> | Has.External.OneToOne.IMetadata<Target>
    >,
>(
    mine: Creator<Mine>,
    metadata:
        | Has.OneToOne.IMetadata<Target>
        | Has.External.OneToOne.IMetadata<Target>,
    myData: Mine[],
    field: Field,
    options: IAppJoinChildTuple.IOptions<Target>,
): Promise<Target[]> {
    if (myData.length === 0) return [];

    // MY TABLE & DATA
    const myTable: ITableInfo = ITableInfo.get(mine);
    const myDict: Map<any, Pair<Mine, Target | null>> = new Map(
        myData.map((record) => [
            (record as any)[myTable.primaryColumn],
            new Pair(record, null),
        ]),
    );
    const myIdList: any[] = myData.map(
        (rec) => (rec as any)[myTable.primaryColumn],
    );

    // LOAD TARGET DATA
    const target: Creator<Target> = metadata.target();
    const output: Target[] =
        options.targetData ||
        (await get_records_by_where_in(
            target,
            metadata.inverse,
            myIdList,
            options.filter,
        ));

    // LINK RELATIONSHIPS
    for (const targetRecord of output) {
        const inverse: Belongs.OneToOne<Mine, any> = (targetRecord as any)[
            metadata.inverse
        ];
        const tuple: Pair<Mine, Target | null> | undefined = myDict.get(
            inverse.id,
        );

        if (tuple === undefined) continue;

        tuple.second = targetRecord;
        await inverse.set(tuple.first);
    }
    for (const tuple of myDict.values())
        await ((<any>tuple.first[field]) as Has.OneToOne<Target>).set(
            tuple.second,
        );

    // RECURSIVE
    if (<any>target === mine && !options.targetData) {
        const surplus: Target[] = await app_join_has_one_to_one(
            mine,
            metadata,
            (<any>output) as Mine[],
            field,
            options,
        );
        output.push(...surplus);
    }
    return output;
}
