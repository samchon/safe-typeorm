import { BbsArticle } from "../models/BbsArticle";
import { BbsProduct } from "../models/BbsProduct";
import { BbsReviewArticle } from "../models/BbsReviewArticle";

export function prepare_random_bbs_review_article
    (
        article: BbsArticle,
        product: BbsProduct | null
    ): BbsReviewArticle
{
    return BbsReviewArticle.initialize({
        base: article,
        product
    });
}