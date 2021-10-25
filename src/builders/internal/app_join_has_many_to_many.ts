import * as orm from "typeorm";
import { Pair } from "tstl/utility/Pair";

import { Creator } from "../../typings/Creator";
import { Has } from "../../decorators/Has";
import { ITableInfo } from "../../functional/internal/ITableInfo";
import { getWhereArguments } from "../../functional/getWhereArguments";
import { findRepository } from "../../functional/findRepository";

import { AppJoinBuilder } from "../AppJoinBuilder";
import { JoinQueryBuilder } from "../JoinQueryBuilder";

import { IAppJoinChildTuple } from "./IAppJoinChildTuple";

/**
 * @internal
 */
export async function app_join_has_many_to_many
    (
        mine: Creator<any>,
        child: IAppJoinChildTuple<any, Has.ManyToMany.IMetadata<any, any>>,
        data: any[],
        field: any
    ): Promise<any[]>
{
    if (data.length === 0)
        return [];

    // MY TABLE & DATA
    const myTable: ITableInfo = ITableInfo.get(mine);
    const myDict: Map<any, Pair<any, any[]>> = new Map(data.map(elem => [
        elem[myTable.primaryColumn],
        new Pair(elem, [])
    ]));
    const myIdList: any[] = data.map(rec => rec[myTable.primaryColumn]);

    // LOAD TARGET DATA
    const router: Creator<any> = child.metadata.router();
    const stmt: orm.SelectQueryBuilder<any> = 
        findRepository(router)
        .createQueryBuilder();
    new JoinQueryBuilder(stmt, router).innerJoinAndSelect(child.metadata.target_inverse);

    const routeList: any[] = [];
    while (myIdList.length !== 0)
    {
        const some: any[] = myIdList.splice(0, AppJoinBuilder.MAX_VARIABLE_COUNT);
        routeList.push(...await stmt
            .clone()
            .andWhere(...getWhereArguments(router, child.metadata.my_inverse as "id", "IN", some))
            .getMany()
        );
    }

    const output: any[] = [];

    // LINK RELATIONSHIPS
    for (const router of routeList)
    {
        const entry: any = myDict.get(router[child.metadata.my_inverse].id)!;
        const target: any = await router[child.metadata.target_inverse].get();

        const tuple: Has.ManyToMany.ITuple<any, any> = {
            router: router,
            target: target,
        };
        entry.second.push(tuple);
        output.push(target);
    }
    for (const entry of myDict.values())
    {
        if (child.metadata.comparator)
            entry.second = entry.second.sort(child.metadata.comparator);
        await entry.first[field].set(entry.second.map(elem => elem.target));
    }

    // RECURSIVE
    if (child.metadata.target() === mine)
        await app_join_has_many_to_many(mine, child, output, field);

    return output;
}