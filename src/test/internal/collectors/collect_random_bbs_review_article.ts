import safe from "../../..";
import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsReviewArticle } from "../../models/bbs/BbsReviewArticle";
import { BbsReviewArticleContent } from "../../models/bbs/BbsReviewArticleContent";
import { prepare_random_bbs_review_article } from "../preparations/prepare_random_bbs_review_article";
import { prepare_random_bbs_review_article_content } from "../preparations/prepare_random_bbs_review_article_content";

export async function collect_random_bbs_review_article(
    collection: safe.InsertCollection,
    article: BbsArticle,
): Promise<BbsReviewArticle> {
    const review: BbsReviewArticle = prepare_random_bbs_review_article(article);
    await article.review.set(review);
    collection.push(review);

    for (const content of await article.contents.get()) {
        const reviewContent: BbsReviewArticleContent =
            prepare_random_bbs_review_article_content(content);
        await content.reviewContent.set(reviewContent);
        collection.push(reviewContent);
    }
    return review;
}
