import { randint } from "tstl";
import safe from "../../..";

import { BbsArticle } from "../../models/BbsArticle";
import { BbsArticleTag } from "../../models/BbsArticleTag";
import { BbsComment } from "../../models/BbsComment";
import { BbsGroup } from "../../models/BbsGroup";
import { BbsReviewArticle } from "../../models/BbsReviewArticle";

import { ArrayUtil } from "../../../utils/ArrayUtil";
import { collect_random_bbs_article } from "../collectors/collect_random_bbs_article";
import { collect_random_bbs_comment } from "../collectors/collect_random_bbs_comment";
import { prepare_random_bbs_article_tag } from "../preparations/prepare_random_bbs_article_tag";
import { prepare_random_bbs_group } from "../preparations/prepare_random_bbs_group";

export async function __generate_random_bbs_group
    (
        closure: (collection: safe.InsertCollection, article: BbsArticle) => Promise<BbsReviewArticle | null>
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
        randint(10, 20), 
        index => collect_random_bbs_article
        (
            collection, 
            group, 
            new Date(Date.now() + index * 1000)
        )
    );
    await group.articles.set(articleList);

    for (const article of articleList)
    {
        // REVIEW
        await article.review.set(await closure(collection, article));

        // COMMENTS
        const comments: BbsComment[] = await ArrayUtil.asyncRepeat
        (
            randint(0, 50),
            index => collect_random_bbs_comment
            (
                collection,
                article,
                new Date(Date.now() + index * 1000)
            )
        );
        await article.comments.set(comments);
        
        // TAGS
        const tags: BbsArticleTag[] = ArrayUtil.repeat
        (
            randint(0, 4),
            () => prepare_random_bbs_article_tag(article)
        );
        await article.tags.set(tags);
    }
    
    await collection.execute();
    return group;
}