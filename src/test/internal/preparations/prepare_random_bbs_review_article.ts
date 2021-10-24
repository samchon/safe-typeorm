import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsReviewArticle } from "../../models/bbs/BbsReviewArticle";

import { RandomGenerator } from "../procedures/RandomGenerator";

export function prepare_random_bbs_review_article(article: BbsArticle): BbsReviewArticle
{
    return BbsReviewArticle.initialize({
        base: article,
        manufacturer: RandomGenerator.name(),
        product: RandomGenerator.name(),
    });
}