import safe from "../../..";
import { BbsArticle } from "../../models/BbsArticle";
import { BbsReviewArticle } from "../../models/BbsReviewArticle";
import { prepare_random_bbs_review_article } from "../preparations/prepare_random_bbs_review_article";

export function collect_random_bbs_review_article
    (
        collection: safe.InsertCollection,
        article: BbsArticle
    ): BbsReviewArticle
{
    const review: BbsReviewArticle = prepare_random_bbs_review_article(article);
    return collection.push(review);
}