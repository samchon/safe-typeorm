import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsReviewArticle } from "../../models/bbs/BbsReviewArticle";

export async function iterate_bbs_review_article(review: BbsReviewArticle): Promise<void>
{
    const article: BbsArticle = await review.base.get();
    await article.group.get();
    await article.category.get();

    for (const content of await article.contents.get())
    {
        await content.files.get();
        await content.reviewContent.get();
    }
    for (const comment of await article.comments.get())
        await comment.files.get();
}