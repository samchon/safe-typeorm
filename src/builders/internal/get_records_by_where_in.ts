import * as orm from "typeorm";

import { Creator } from "../../typings/Creator";
import { getWhereArguments } from "../../functional/getWhereArguments";

import { AppJoinBuilder } from "../AppJoinBuilder";

/**
 * @internal
 */
export async function get_records_by_where_in
    (
        target: Creator<any>, 
        field: string, 
        idList: any[]
    ): Promise<any[]>
{
    // LOAD TARGET DATA
    const output: any[] = [];
    while (idList.length !== 0)
    {
        const some: any[] = idList.splice(0, AppJoinBuilder.MAX_VARIABLE_COUNT);
        output.push
        (...await orm.getRepository(target)
            .createQueryBuilder()
            .andWhere(...getWhereArguments(target, field as "id", "IN", some))
            .getMany()
        );
    }
    return output;
}