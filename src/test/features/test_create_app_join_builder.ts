import safe from "../..";
import { must_not_query_anything } from "../internal/must_not_query_anything";
import { BbsGroup } from "../models/BbsGroup";
import { iterate_bbs_group } from "../preparations/iterate_bbs_group";
import { test_insert_collection } from "./test_insert_collection";

async function get_clean_group(): Promise<BbsGroup>
{
    const group: BbsGroup = await test_insert_collection();
    return await BbsGroup.findOneOrFail(group.id);
}

export async function test_app_join(): Promise<void>
{
    const group: BbsGroup = await get_clean_group();
    const builder: safe.AppJoinBuilder<BbsGroup> = safe.createAppJoinBuilder(BbsGroup, group =>
    {
        group.join("articles", article =>
        {
            article.join("contents").join("files");
            article.join("comments").join("files");
        });
    });
    await builder.execute([ group ]);

    await must_not_query_anything
    (
        "AppJoinBuilder.execute()", 
        () => iterate_bbs_group(group)
    );
}