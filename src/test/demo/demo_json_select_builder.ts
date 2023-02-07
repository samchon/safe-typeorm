import safe from "safe-typeorm";

import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsArticleContent } from "../models/bbs/BbsArticleContent";
import { BbsArticleTag } from "../models/bbs/BbsArticleTag";
import { BbsCategory } from "../models/bbs/BbsCategory";
import { BbsGroup } from "../models/bbs/BbsGroup";
import { IBbsGroup } from "../structures/IBbsGroup";

export async function demo_app_join_builder(
    groups: BbsGroup[],
): Promise<IBbsGroup[]> {
    const builder = new safe.JsonSelectBuilder(BbsGroup, {
        articles: new safe.JsonSelectBuilder(BbsArticle, {
            group: safe.DEFAULT,
            category: new safe.JsonSelectBuilder(BbsCategory, {
                parent: "recursive" as const,
            }),
            tags: new safe.JsonSelectBuilder(
                BbsArticleTag,
                {},
                (tag) => tag.value, // OUTPUT CONVERSION BY MAPPING
            ),
            contents: new safe.JsonSelectBuilder(BbsArticleContent, {
                files: "join" as const,
            }),
        }),
    });
    return builder.getMany(groups);
}
