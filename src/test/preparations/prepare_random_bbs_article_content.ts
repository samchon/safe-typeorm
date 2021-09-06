import { randint } from "tstl";
import safe from "../..";
import { RandomGenerator } from "../internal/RandomGenerator";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleContent } from "../models/BbsArticleContent";

export function prepare_random_bbs_article_content
    (
        article: BbsArticle,
        created_at: Date = new Date()
    ): BbsArticleContent
{
    return BbsArticleContent.initialize({
        id: safe.DEFAULT,
        article,
        title: RandomGenerator.paragraph(randint(2, 5)),
        body: RandomGenerator.content(randint(1, 15)),
        created_at,
    });
}