import { randint } from "tstl/algorithm/random";

import { BbsArticleContent } from "../../models/bbs/BbsArticleContent";
import { BbsReviewArticleContent } from "../../models/bbs/BbsReviewArticleContent";

export function prepare_random_bbs_review_article_content(
    base: BbsArticleContent,
): BbsReviewArticleContent {
    return BbsReviewArticleContent.initialize({
        base,
        price: randint(1, 300) * 10_000,
        score: randint(0, 100),
    });
}
