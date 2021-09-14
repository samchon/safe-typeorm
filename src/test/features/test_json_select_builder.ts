import { equal } from "tstl/ranges/algorithm";

import safe from "../..";
import { AttachmentFile } from "../models/AttachmentFile";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsArticleTag } from "../models/BbsArticleTag";
import { BbsCategory } from "../models/BbsCategory";
import { BbsGroup } from "../models/BbsGroup";

import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";
import { IBbsGroup } from "../structures/IBbsGroup";
import { IBbsArticle } from "../structures/IBbsArticle";
import { IBbsArticleContent } from "../structures/IBbsArticleContent";

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
                children: undefined, // INVERSE
                articles: undefined, // INVERSE
            }),
            tags: safe.createJsonSelectBuilder(BbsArticleTag, 
            {
                article: undefined // INVERSE
            }, tag => tag.value),
            contents: safe.createJsonSelectBuilder(BbsArticleContent, 
            {
                article: undefined, // INVERSE
                files: safe.createJsonSelectBuilder(AttachmentFile, {})
            }),
            __mv_last: undefined, // MATERIAL
            review: undefined, // SUB-TYPE
            question: undefined, // SUB-TYPE
            answer: undefined, // SUB-TYPE
            comments: undefined, // ONE-TO-MAY
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
    reverse;

    for (let i: number = 0; i < data.length; ++i)
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