import safe from "../../..";
import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsArticleTag } from "../../models/bbs/BbsArticleTag";
import { RandomGenerator } from "../procedures/RandomGenerator";

export function prepare_random_bbs_article_tag(
    article: BbsArticle,
): BbsArticleTag {
    return BbsArticleTag.initialize({
        id: safe.DEFAULT,
        article,
        value: RandomGenerator.name(),
    });
}
