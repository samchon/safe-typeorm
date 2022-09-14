import { equal } from "tstl/ranges/algorithm";

import safe from "../..";
import { ArrayUtil } from "../../utils/ArrayUtil";
import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";
import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsArticleContent } from "../models/bbs/BbsArticleContent";
import { BbsArticleTag } from "../models/bbs/BbsArticleTag";
import { BbsCategory } from "../models/bbs/BbsCategory";
import { BbsGroup } from "../models/bbs/BbsGroup";
import { IBbsArticle } from "../structures/IBbsArticle";
import { IBbsGroup } from "../structures/IBbsGroup";

export async function test_json_select_builder(): Promise<IBbsGroup[]> {
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

    const models: BbsGroup[] = await generate_random_clean_groups();
    await builder.join(models);

    const data = await must_not_query_anything(
        "JsonSelectBuilder.getMany()",
        () => builder.getMany(models, true),
    );

    // TYPE CHECKING
    const regular: IBbsGroup[] = data;
    const reverse: typeof data = regular;

    await ArrayUtil.asyncRepeat(reverse.length, async (i) => {
        const modelGroup: BbsGroup = models[i];
        const jsonGroup: IBbsGroup = data[i];

        if (modelGroup.id !== jsonGroup.id)
            throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");

        const modelArticleList: BbsArticle[] = await modelGroup.articles.get();
        await ArrayUtil.asyncRepeat(jsonGroup.articles.length, async (j) => {
            const jsonArticle: IBbsArticle = data[i].articles[j];
            if (jsonArticle.group !== modelGroup.id)
                throw new Error(
                    "Bug on JsonSelectBuilder.getMany(): wrong data.",
                );

            const modelArticle: BbsArticle = modelArticleList[j];
            if (jsonArticle.id !== modelArticle.id)
                throw new Error(
                    "Bug on JsonSelectBuilder.getMany(): wrong data.",
                );
            else if (
                (jsonArticle.category?.id || null) !== modelArticle.category.id
            )
                throw new Error(
                    "Bug on JsonSelectBuilder.getMany(): wrong data.",
                );

            const modelTags: string[] = (await modelArticle.tags.get()).map(
                (t) => t.value,
            );
            if (equal(modelTags, jsonArticle.tags) === false)
                throw new Error(
                    "Bug on JsonSelectBuilder.getMany(): wrong data.",
                );

            const modelContentList: BbsArticleContent[] =
                await modelArticle.contents.get();

            jsonArticle.contents.forEach((jsonContent, k) => {
                const modelContent: BbsArticleContent = modelContentList[k];
                if (modelContent.id !== jsonContent.id)
                    throw new Error(
                        "Bug on JsonSelectBuilder.getMany(): wrong data.",
                    );
            });
        });
    });
    return regular;
}
