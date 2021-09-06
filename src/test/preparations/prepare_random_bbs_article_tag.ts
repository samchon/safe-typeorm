import safe from "../..";

import { RandomGenerator } from "../internal/RandomGenerator";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleTag } from "../models/BbsArticleTag";

export function prepare_random_bbs_article_tag(article: BbsArticle): BbsArticleTag
{
    return BbsArticleTag.initialize({
        id: safe.DEFAULT,
        article,
        value: RandomGenerator.name()
    });
}