import * as orm from "typeorm";
import { Pair } from "tstl/utility/Pair";

import { Creator } from "../../typings/Creator";
import { Has } from "../../decorators/Has";
import { ITableInfo } from "../../functional/internal/ITableInfo";
import { getWhereArguments } from "../../functional/getWhereArguments";
import { findRepository } from "../../functional/findRepository";

import { AppJoinBuilder } from "../AppJoinBuilder";
import { JoinQueryBuilder } from "../JoinQueryBuilder";
import { get_records_by_where_in } from "./get_records_by_where_in";
import { Belongs } from "../../decorators/Belongs";
import { IAppJoinChildTuple } from "./IAppJoinChildTuple";

/**
 * @internal
 */
export async function app_join_has_many_to_many<
        Mine extends object,
        Target extends object,
        Router extends object,
        Field extends Has.ManyToMany.IMetadata<Target, Router>>
    (
        mine: Creator<Mine>,
        metadata: Has.ManyToMany.IMetadata<Target, Router>,
        myData: Mine[],
        field: Field,
        options: app_join_has_many_to_many.IOptions<Target, Router>
    ): Promise<Target[]>
{
    // NO DATA OR MANUAL JOIN
    if (myData.length === 0)
        return [];
    else if (options.targetData)
        return app_join_has_many_to_many_manual
        (
            mine, 
            metadata, 
            myData, 
            field,
            options.targetData,
            options.routerData
        );

    // MY TABLE & DATA
    const myTable: ITableInfo = ITableInfo.get(mine);
    const myDict: Map<any, Pair<Mine, Has.ManyToMany.ITuple<Target, Router>[]>> = new Map(myData.map(elem => [
        (elem as any)[myTable.primaryColumn],
        new Pair(elem, [])
    ]));
    const myIdList: any[] = myData.map(rec => (rec as any)[myTable.primaryColumn]);

    // LOAD TARGET DATA
    const router: Creator<Router> = metadata.router();
    const stmt: orm.SelectQueryBuilder<Router> = 
        findRepository(router)
        .createQueryBuilder();
    new JoinQueryBuilder(stmt, router)
        .innerJoinAndSelect(<any>metadata.target_inverse);

    const routeList: Router[] = [];
    while (myIdList.length !== 0)
    {
        const some: any[] = myIdList.splice(0, AppJoinBuilder.MAX_VARIABLE_COUNT);
        const partial: orm.SelectQueryBuilder<Router> = await stmt
            .clone()
            .andWhere(...getWhereArguments(router, metadata.my_inverse as "id", "IN", some));
        if (options.filter)
            options.filter(<any>partial as orm.SelectQueryBuilder<Target>);
        routeList.push(...await partial.getMany());
    }

    // LINK RELATIONSHIPS
    const output: Target[] = [];
    for (const router of routeList)
    {
        const entry: Pair<Mine, Has.ManyToMany.ITuple<Target, Router>[]> | undefined = myDict.get((router as any)[metadata.my_inverse].id);
        if (entry === undefined)
            continue;

        const target: Target = await (router as any)[metadata.target_inverse].get();
        const tuple: Has.ManyToMany.ITuple<Target, Router> = {
            router,
            target,
        };
        entry.second.push(tuple);
        output.push(target);
    }
    for (const entry of myDict.values())
    {
        if (metadata.comparator)
            entry.second = entry.second.sort(metadata.comparator);
        await (entry.first as any)[field].set(entry.second.map(elem => elem.target));
    }

    // RECURSIVE
    if (<any>metadata.target() === mine)
    {
        const surplus: Target[] = await app_join_has_many_to_many
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
export namespace app_join_has_many_to_many
{
    export interface IOptions<Target extends object, Router extends object> 
        extends IAppJoinChildTuple.IOptions<Target>
    {
        routerData: Router[] | null;
    }
}

async function app_join_has_many_to_many_manual<
        Mine extends object,
        Target extends object,
        Router extends object,
        Field extends Has.ManyToMany.IMetadata<Target, Router>>
    (
        mine: Creator<Mine>,
        metadata: Has.ManyToMany.IMetadata<Target, Router>,
        myData: Mine[],
        field: Field,
        targetData: Target[],
        routerData: Router[] | null,
    ): Promise<Target[]>
{
    // MY TABLE & DATA
    const myTable: ITableInfo = ITableInfo.get(mine);
    const myDict: Map<any, Pair<Mine, Target[]>> = new Map(myData.map(elem => [
        (elem as any)[myTable.primaryColumn],
        new Pair(elem, [])
    ]));
    const myIdList: any[] = myData.map(rec => (rec as any)[myTable.primaryColumn]);

    // TARGET TABLE & DATA
    const targetTable: ITableInfo = ITableInfo.get(metadata.target());
    const targetDict: Map<any, Target> = new Map(targetData.map(elem => [
        (elem as any)[targetTable.primaryColumn],
        elem
    ]));

    // LOAD ROUTER DATA
    if (routerData === null)
        routerData = await get_records_by_where_in
        (
            metadata.router(),
            metadata.my_inverse,
            myIdList,
            null
        );

    // LINK RELATIONSHIPS
    for (const router of routerData)
    {
        const myInverse = (router as any)[metadata.my_inverse] as Belongs.ManyToOne<Mine, any>;
        const myTuple: Pair<Mine, Target[]> | undefined = myDict.get(myInverse.id);
        if (myTuple === undefined)
            continue;

        const targetInverse = (router as any)[metadata.target_inverse] as Belongs.ManyToOne<Target, any>;
        const target: Target | undefined = targetDict.get(targetInverse.id);
        if (target === undefined)
            continue;

        myTuple.second.push(target);
    }
    for (const entry of myDict.values())
    {
        const accessor: Has.ManyToMany<Target, Router> = (entry.first as any)[field];
        await accessor.set(entry.second);
    }

    // RETURNS
    return targetData;
}