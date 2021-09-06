import { is_sorted } from "tstl/ranges/algorithm";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsComment } from "../models/BbsComment";
import { BbsGroup } from "../models/BbsGroup";
import { BbsProduct } from "../models/BbsProduct";
import { BbsReviewArticle } from "../models/BbsReviewArticle";

export async function iterate_bbs_group(group: BbsGroup): Promise<void>
{
    for (const article of await group.articles.get())
    {
        await article.category.get();
        if (await article.group.get() !== group)
            throw new Error("Bug on Belongs.ManyToOne.get(): different parent.");
        
        // REVIEW
        const review: BbsReviewArticle | null = await article.review.get();
        if (review !== null)
        {
            const product: BbsProduct | null = await review.product.get();
            if (product !== null && await product.review.get() !== review)
                throw new Error("Bug on Belongs.OneToOne.get(): different parent.");
        }

        // CONTENTS
        const contentList: BbsArticleContent[] = await article.contents.get();
        if (is_sorted(contentList, (x, y) => x.created_at.getTime() < y.created_at.getTime()) === false)
            throw new Error("Bug on Has.OneToMany.get(): not sorted.");

        for (const content of contentList)
        {
            if (article !== await content.article.get())
                throw new Error("Bug on Belongs.ManyToOne.get(): different parent.");
            await content.files.get();
        }

        // COMMENTS
        const commentList: BbsComment[] = await article.comments.get();
        if (is_sorted(commentList, (x, y) => x.created_at.getTime() < y.created_at.getTime()) === false)
            throw new Error("Bug on Has.OneToMany(): not sorted.");

        for (const comment of commentList)
        {
            if (article !== await comment.article.get())
                throw new Error("Bug on Belongs.ManyToOne.get(): different parent.");
            await comment.files.get();
        }
    }
}