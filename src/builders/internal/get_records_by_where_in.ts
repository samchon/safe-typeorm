import * as orm from "typeorm";

import { findRepository } from "../../functional/findRepository";
import { getWhereArguments } from "../../functional/getWhereArguments";

import { Creator } from "../../typings/Creator";

import { AppJoinBuilder } from "../AppJoinBuilder";

/**
 * @internal
 */
export async function get_records_by_where_in<Target extends object>(
    target: Creator<Target>,
    field: string,
    idList: any[],
    filter: null | ((stmt: orm.SelectQueryBuilder<Target>) => void),
): Promise<any[]> {
    // LOAD TARGET DATA
    const output: any[] = [];
    while (idList.length !== 0) {
        const some: any[] = idList.splice(0, AppJoinBuilder.MAX_VARIABLE_COUNT);
        const stmt: orm.SelectQueryBuilder<Target> = await findRepository(
            target,
        )
            .createQueryBuilder()
            .andWhere(...getWhereArguments(target, field as "id", "IN", some));
        if (filter) filter(stmt);
        output.push(...(await stmt.getMany()));
    }
    return output;
}
