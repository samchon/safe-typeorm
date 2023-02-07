import safe from "safe-typeorm";

import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsArticleContent } from "../models/bbs/BbsArticleContent";
import { BbsComment } from "../models/bbs/BbsComment";
import { BbsGroup } from "../models/bbs/BbsGroup";
import { BbsReviewArticle } from "../models/bbs/BbsReviewArticle";

export async function test_app_join_builder_initialize(
    groups: BbsGroup[],
): Promise<void> {
    const builder = safe.AppJoinBuilder.initialize(BbsGroup, {
        articles: safe.AppJoinBuilder.initialize(BbsArticle, {
            group: undefined,
            review: safe.AppJoinBuilder.initialize(BbsReviewArticle, {
                base: undefined,
            }),
            category: "join" as const,
            contents: safe.AppJoinBuilder.initialize(BbsArticleContent, {
                files: "join" as const,
                article: undefined,
                reviewContent: undefined,
            }),
            comments: safe.AppJoinBuilder.initialize(BbsComment, {
                article: undefined,
                files: "join",
            }),
            tags: "join",
            __mv_last: undefined,
            question: undefined,
            answer: undefined,
            scraps: undefined,
        }),
    });
    await builder.execute(groups);
}
