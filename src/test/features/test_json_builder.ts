import { equal } from "tstl/ranges/algorithm";
import { assertType } from "typescript-is";
import safe from "../..";

import { generate_random_clean_groups } from "../generators/generate_random_clean_groups";
import { AttachmentFile } from "../models/AttachmentFile";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsArticleTag } from "../models/BbsArticleTag";
import { BbsCategory } from "../models/BbsCategory";
import { BbsGroup } from "../models/BbsGroup";

export async function test_json_builder(): Promise<void>
{
    const builder = safe.createJsonSelectBuilder(BbsGroup, {
        id: safe.DEFAULT,
        code: safe.DEFAULT,
        name: safe.DEFAULT,
        created_at: date => date.toString(),
        deleted_at: date => date?.toString() || null,

        articles: safe.createJsonSelectBuilder(BbsArticle, {
            id: safe.DEFAULT,
            writer: safe.DEFAULT,
            ip: safe.DEFAULT,
            password: undefined,
            created_at: date => date.toString(),
            deleted_at: date => date?.toString() || null,
            
            group: safe.DEFAULT,
            category: safe.createJsonSelectBuilder(BbsCategory, {
                id: safe.DEFAULT,
                code: safe.DEFAULT,
                name: safe.DEFAULT,
                created_at: date => date.toString(),
                deleted_at: date => date?.toString() || null,
                articles: undefined
            }),
            review: undefined,
            tags: safe.createJsonSelectBuilder(BbsArticleTag, {
                id: undefined,
                article: undefined,
                value: safe.DEFAULT
            }, tag => tag.value),
            contents: safe.createJsonSelectBuilder(BbsArticleContent, {
                id: safe.DEFAULT,
                title: safe.DEFAULT,
                body: safe.DEFAULT,
                created_at: date => date.toString(),

                article: undefined,
                files: safe.createJsonSelectBuilder(AttachmentFile, {
                    id: undefined,
                    name: safe.DEFAULT,
                    extension: safe.DEFAULT,
                    url: safe.DEFAULT,
                })
            }),
            comments: undefined,
        })
    });

    const models: BbsGroup[] = await generate_random_clean_groups();
    const data = await builder.getMany(models);
    assertType<IGroup[]>(data);
    
    for (let i: number = 0; i < data.length; ++i)
    {
        const modelGroup: BbsGroup = models[i];
        const jsonGroup: IGroup = data[i];

        if (modelGroup.id !== jsonGroup.id)
            throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");

        const modelArticleList: BbsArticle[] = await modelGroup.articles.get();
        for (let j: number = 0; j < jsonGroup.articles.length; ++j)
        {
            const jsonArticle: IArticle = jsonGroup.articles[j];
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
                const jsonContent: IContent = jsonArticle.contents[k];

                if (modelContent.id !== jsonContent.id)
                    throw new Error("Bug on JsonSelectBuilder.getMany(): wrong data.");
            }
        }
    }
}

interface ICategory
{
    id: string;
    code: string;
    name: string;
    created_at: string;
    deleted_at: string | null;
}
interface IGroup
{
    id: string;
    code: string;
    name: string;
    created_at: string;
    deleted_at: string | null;

    articles: IArticle[];
}
interface IArticle
{
    id: string;
    writer: string;
    ip: string;
    created_at: string;
    deleted_at: string | null;

    group: string;
    tags: string[];
    category: ICategory | null;
    contents: IContent[];
}
interface IContent
{
    id: string;
    title: string;
    body: string;
    created_at: string;

    files: IFile[];
}
interface IFile
{
    name: string;
    extension: string | null;
    url: string;
}