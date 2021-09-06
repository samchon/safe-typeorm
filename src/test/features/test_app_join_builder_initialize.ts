import safe, { AppJoinBuilder } from "../..";
import { must_not_query_anything } from "../internal/must_not_query_anything";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsComment } from "../models/BbsComment";
import { BbsGroup } from "../models/BbsGroup";
import { iterate_bbs_group } from "../preparations/iterate_bbs_group";
import { test_insert_collection } from "./test_insert_collection";

async function get_clean_group(): Promise<BbsGroup>
{
    const group: BbsGroup = await test_insert_collection();
    return await BbsGroup.findOneOrFail(group.id);
}

export async function test_app_join_builder_initialize(): Promise<void>
{
    const group: BbsGroup = await get_clean_group();
    const builder: AppJoinBuilder<BbsGroup> = safe.AppJoinBuilder.initialize(BbsGroup, {
        articles: safe.AppJoinBuilder.initialize(BbsArticle, {
            group: null,
            contents: safe.AppJoinBuilder.initialize(BbsArticleContent, {
                article: null,
                files: "join"
            }),
            comments: safe.AppJoinBuilder.initialize(BbsComment, {
                article: null,
                files: "join"
            })
        })
    });
    await builder.execute([ group ]);
    await must_not_query_anything
    (
        "AppJoinBuilder.initialize()",
        () => iterate_bbs_group(group)
    )
}