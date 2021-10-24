import { BbsGroup } from "../models/bbs/BbsGroup";

import { iterate_bbs_group } from "../internal/iterators/iterate_bbs_group";
import { generate_random_empty_review_bbs_group } from "../internal/generators/generate_random_empty_review_bbs_group";
import { generate_random_normal_bbs_group } from "../internal/generators/generate_random_normal_bbs_group";
import { generate_random_review_bbs_group } from "../internal/generators/generate_random_review_bbs_group";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";

export async function test_relationship_setter(): Promise<void>
{
    const groupList: BbsGroup[] = [
        await generate_random_normal_bbs_group(),
        await generate_random_review_bbs_group(),
        await generate_random_empty_review_bbs_group(),
    ];

    await must_not_query_anything
    (
        "AppJoinBuilder.execute()", 
        async () =>
        {
            for (const group of groupList)
                await iterate_bbs_group(group);
        }
    );
}