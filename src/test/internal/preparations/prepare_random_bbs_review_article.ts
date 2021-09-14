import { randint } from "tstl/algorithm/random";

import { BbsArticle } from "../../models/BbsArticle";
import { BbsReviewArticle } from "../../models/BbsReviewArticle";

import { RandomGenerator } from "../procedures/RandomGenerator";

export function prepare_random_bbs_review_article(article: BbsArticle): BbsReviewArticle
{
    return BbsReviewArticle.initialize({
        base: article,
        manufacturer: RandomGenerator.name(),
        product: RandomGenerator.name(),
        price: randint(30, 100) * 1000,
        score: randint(0, 100)
    });
}