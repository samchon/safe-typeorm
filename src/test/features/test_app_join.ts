import safe from "../..";
import { Relationship } from "../../typings";
import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";
import { AttachmentFile } from "../models/bbs/AttachmentFile";
import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsArticleContent } from "../models/bbs/BbsArticleContent";
import { BbsArticleTag } from "../models/bbs/BbsArticleTag";
import { BbsComment } from "../models/bbs/BbsComment";
import { BbsGroup } from "../models/bbs/BbsGroup";

function reload<Mine extends { id: string }>(records: Mine[]): Promise<Mine[]> {
    return safe
        .findRepository(records[0].constructor as safe.typings.Creator<Mine>)
        .createQueryBuilder()
        .andWhereInIds(records.map((record) => record.id))
        .getMany();
}

async function test<
    Mine extends safe.Model & { id: string } & {
        [key in Field]: Relationship<Target>;
    },
    Target extends object,
    Field extends safe.typings.SpecialFields<Mine, Relationship<Target>>,
>(records: Mine[], field: Field, targets: Target[]): Promise<void> {
    if (records.length === 0) return;

    const reloaded: Mine[] = await reload(records);
    await safe.appJoin<Mine, Target, Field>(reloaded, field);
    await must_not_query_anything(
        `appJoin(${records[0].constructor.name}, "${field}")`,
        async () => {
            for (const elem of reloaded) await elem[field].get();
        },
    );

    const retry: Mine[] = await reload(records);
    await safe.appJoin<Mine, Target, Field>(retry, field, targets);
    await must_not_query_anything(
        `appJoin(${records[0].constructor.name}, "${field}", targets)`,
        async () => {
            for (const elem of retry) await elem[field].get();
        },
    );
}

export async function test_app_join(): Promise<void> {
    const groupList: BbsGroup[] = await generate_random_clean_groups();
    const articleList: BbsArticle[] = [];
    const tagList: BbsArticleTag[] = [];
    const contentList: BbsArticleContent[] = [];
    const commentList: BbsComment[] = [];
    const contentFileList: AttachmentFile[] = [];
    const commentFileList: AttachmentFile[] = [];

    for (const group of groupList)
        for (const article of await group.articles.get()) {
            articleList.push(article);
            for (const content of await article.contents.get()) {
                contentList.push(content);
                contentFileList.push(...(await content.files.get()));
            }
            for (const comment of await article.comments.get()) {
                commentList.push(comment);
                commentFileList.push(...(await comment.files.get()));
            }
            tagList.push(...(await article.tags.get()));
        }

    await test(groupList, "articles", articleList);
    await test(articleList, "contents", contentList);
    await test(articleList, "comments", commentList);
    await test(articleList, "tags", tagList);
    await test(contentList, "files", contentFileList);
    await test(commentList, "files", commentFileList);

    await test(tagList, "article", articleList);
    await test(contentList, "article", articleList);
    await test(commentList, "article", articleList);
    await test(articleList, "group", groupList);
}
