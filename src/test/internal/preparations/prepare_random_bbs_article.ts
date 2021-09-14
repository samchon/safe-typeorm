import safe from "../../..";
import { BbsArticle } from "../../models/BbsArticle";
import { BbsGroup } from "../../models/BbsGroup";

import { RandomGenerator } from "../procedures/RandomGenerator";

export function prepare_random_bbs_article(group: BbsGroup, created_at: Date): BbsArticle
{
    return BbsArticle.initialize({
        id: safe.DEFAULT,
        group,
        category: null,
        writer: RandomGenerator.name(),
        ip: RandomGenerator.ip(),
        created_at,
        deleted_at: null
    });
}