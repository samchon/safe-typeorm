import { randint } from "tstl/algorithm/random";
import safe from "../..";
import { ArrayUtil } from "../internal/ArrayUtil";
import { BbsArticle } from "../models/BbsArticle";
import { BbsComment } from "../models/BbsComment";
import { BbsGroup } from "../models/BbsGroup";
import { collect_random_bbs_article } from "../preparations/collect_random_bbs_article";
import { collect_random_bbs_comment } from "../preparations/collect_random_bbs_comment";
import { prepare_random_bbs_group } from "../preparations/prepare_random_bbs_group";

export async function test_insert_collection
    (
        articleCount: number = randint(10, 20),
        commentCount: () => number = () => randint(10, 50)
    ): Promise<BbsGroup>
{
    // PREPARE COLLECTION
    const collection: safe.InsertCollection = new safe.InsertCollection();

    // GROUP
    const group: BbsGroup = prepare_random_bbs_group();
    collection.push(group);

    // ARTICLES
    const articleList: BbsArticle[] = await ArrayUtil.asyncRepeat
    (
        articleCount, 
        index => collect_random_bbs_article
        (
            collection, 
            group, 
            new Date(Date.now() + index * 1000)
        )
    );
    await group.articles.set(articleList);

    // COMMENTS
    for (const article of articleList)
    {
        const comments: BbsComment[] = await ArrayUtil.asyncRepeat
        (
            commentCount(),
            index => collect_random_bbs_comment
            (
                collection,
                article,
                new Date(Date.now() + index * 1000)
            )
        );
        await article.comments.set(comments);
    }
    
    await collection.execute();
    return group;
}