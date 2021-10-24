import { randint } from "tstl/algorithm/random";

import safe from "../../..";
import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsComment } from "../../models/bbs/BbsComment";

import { RandomGenerator } from "../procedures/RandomGenerator";

export function prepare_random_bbs_comment
    (
        article: BbsArticle,
        created_at: Date = new Date()
    ): BbsComment
{
    return BbsComment.initialize({
        id: safe.DEFAULT,
        article,
        writer: RandomGenerator.name(),
        ip: RandomGenerator.ip(),
        content: RandomGenerator.content(randint(1, 3)),
        created_at,
        deleted_at: null
    })
}