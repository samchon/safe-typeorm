import { equal } from "tstl/ranges/algorithm";

import safe from "../..";
import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsArticleContent } from "../models/bbs/BbsArticleContent";
import { BbsArticleTag } from "../models/bbs/BbsArticleTag";
import { BbsCategory } from "../models/bbs/BbsCategory";
import { BbsGroup } from "../models/bbs/BbsGroup";

import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";
import { IBbsArticle } from "../structures/IBbsArticle";
import { IBbsArticleContent } from "../structures/IBbsArticleContent";
import { IBbsGroup } from "../structures/IBbsGroup";

export async function test_json_select_builder(): Promise<void>
{
    const builder = safe.createJsonSelectBuilder(BbsGroup, 
    {
        articles: safe.createJsonSelectBuilder(BbsArticle, 
        {
            group: safe.DEFAULT,
            category: safe.createJsonSelectBuilder(BbsCategory, 
            { 
                parent: "recursive",
            }),
            tags: safe.createJsonSelectBuilder(BbsArticleTag, 
                { article: undefined }, 
                tag => tag.value
            ),
            contents: safe.createJsonSelectBuilder(BbsArticleContent, 
            {
                files: "join",
            }),
        })
    });

    const models: BbsGroup[] = await generate_random_clean_groups();
    await builder.join(models);

    const data = await must_not_query_anything
    (
        "JsonSelectBuilder.getMany()",
        () => builder.getMany(models, true)
    );
    
    // TYPE CHECKING
    const regular: IBbsGroup[] = data;
    const reverse: typeof data = regular;

    for (let i: number = 0; i < reverse.length; ++i)
    {
        const modelGroup: BbsGroup = models[i];
        const jsonGroup: IBbsGroup = data[i];

        if (modelGroup.id !== jsonGroup.id)
            throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");

        const modelArticleList: BbsArticle[] = await modelGroup.articles.get();
        for (let j: number = 0; j < jsonGroup.articles.length; ++j)
        {
            const jsonArticle: IBbsArticle = data[i].articles[j];
            if (jsonArticle.group !== modelGroup.id)
                throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");

            const modelArticle: BbsArticle = modelArticleList[j];
            if (jsonArticle.id !== modelArticle.id)
                throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");
            else if ((jsonArticle.category?.id || null) !== modelArticle.category.id)
                throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");
            
            const modelTags: string[] = (await modelArticle.tags.get()).map(t => t.value);
            if (equal(modelTags, jsonArticle.tags) === false)
                throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");

            const modelContentList: BbsArticleContent[] = await modelArticle.contents.get();
            for (let k: number = 0; k < jsonArticle.contents.length; ++k)
            {
                const modelContent: BbsArticleContent = modelContentList[k];
                const jsonContent: IBbsArticleContent = jsonArticle.contents[k];

                if (modelContent.id !== jsonContent.id)
                    throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");
            }
        }
    }
}