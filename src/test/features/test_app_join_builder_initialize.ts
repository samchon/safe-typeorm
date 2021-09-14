import safe from "../..";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsComment } from "../models/BbsComment";
import { BbsGroup } from "../models/BbsGroup";
import { BbsReviewArticle } from "../models/BbsReviewArticle";

import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";
import { iterate_bbs_group } from "../internal/iterators/iterate_bbs_group";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";

export async function test_app_join_builder_initialize(): Promise<void>
{
    const builder: safe.AppJoinBuilder<BbsGroup> = safe.AppJoinBuilder.initialize(BbsGroup, {
        articles: safe.AppJoinBuilder.initialize(BbsArticle, {
            group: undefined,
            review: safe.AppJoinBuilder.initialize(BbsReviewArticle, {
                base: undefined,
            }),
            category: "join",
            contents: safe.AppJoinBuilder.initialize(BbsArticleContent, {
                article: undefined,
                files: "join"
            }),
            comments: safe.AppJoinBuilder.initialize(BbsComment, {
                article: undefined,
                files: "join"
            }),
            tags: "join",
            __mv_last: undefined,
            question: undefined,
            answer: undefined,
        })
    });

    const groupList: BbsGroup[] = await generate_random_clean_groups();
    await builder.execute(groupList);

    await must_not_query_anything
    (
        "AppJoinBuilder.initialize()",
        async () => 
        {
            for (const group of groupList)
                await iterate_bbs_group(group);
        }
    );
}