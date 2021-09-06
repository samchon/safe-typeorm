import safe from "../..";
import { BbsArticle } from "../models/BbsArticle";
import { BbsProduct } from "../models/BbsProduct";
import { BbsReviewArticle } from "../models/BbsReviewArticle";
import { prepare_random_bbs_review_article } from "../preparations/prepare_random_bbs_review_article";
import { prepare_random_product } from "../preparations/prepare_random_product";

export async function collect_random_bbs_review_article
    (
        collection: safe.InsertCollection,
        article: BbsArticle,
        hasProduct: boolean
    ): Promise<BbsReviewArticle>
{
    const product: BbsProduct | null = (hasProduct === true)
        ? prepare_random_product()
        : null;
        
    const review: BbsReviewArticle = prepare_random_bbs_review_article(article, product);

    if (product !== null)
    {
        collection.push(product);
        await product.review.set(review);
    }
    return collection.push(review);
}