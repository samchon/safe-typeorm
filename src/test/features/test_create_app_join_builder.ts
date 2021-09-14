import safe from "../..";
import { BbsGroup } from "../models/BbsGroup";

import { iterate_bbs_group } from "../internal/iterators/iterate_bbs_group";
import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";

export async function test_create_app_join_builder(): Promise<void>
{
    const builder: safe.AppJoinBuilder<BbsGroup> = safe.createAppJoinBuilder(BbsGroup, group =>
    {
        group.join("articles", article =>
        {
            article.join("review");
            article.join("contents").join("files");
            article.join("comments").join("files");
        });
    });

    const groupList: BbsGroup[] = await generate_random_clean_groups();
    await builder.execute(groupList);

    await must_not_query_anything
    (
        "createAppJoinBuilder()", 
        async () =>
        {
            for (const group of groupList)
                await iterate_bbs_group(group);
        }
    );
}