import safe, { AppJoinBuilder } from "../..";
import { must_not_query_anything } from "../internal/must_not_query_anything";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsComment } from "../models/BbsComment";
import { BbsGroup } from "../models/BbsGroup";
import { BbsReviewArticle } from "../models/BbsReviewArticle";
import { iterate_bbs_group } from "../iterators/iterate_bbs_group";
import { generate_random_clean_groups } from "../generators/generate_random_clean_groups";

export async function test_app_join_builder_initialize(): Promise<void>
{
    const builder: AppJoinBuilder<BbsGroup> = safe.AppJoinBuilder.initialize(BbsGroup, {
        articles: safe.AppJoinBuilder.initialize(BbsArticle, {
            group: null,
            review: safe.AppJoinBuilder.initialize(BbsReviewArticle, {
                base: null,
                product: "join"
            }),
            category: "join",
            contents: safe.AppJoinBuilder.initialize(BbsArticleContent, {
                article: null,
                files: "join"
            }),
            comments: safe.AppJoinBuilder.initialize(BbsComment, {
                article: null,
                files: "join"
            }),
            tags: "join"
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