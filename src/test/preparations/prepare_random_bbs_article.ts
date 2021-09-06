import safe from "../..";
import { RandomGenerator } from "../internal/RandomGenerator";
import { BbsArticle } from "../models/BbsArticle";
import { BbsGroup } from "../models/BbsGroup";

export function prepare_random_bbs_article(group: BbsGroup, created_at: Date): BbsArticle
{
    return BbsArticle.initialize({
        id: safe.DEFAULT,
        group,
        writer: RandomGenerator.name(),
        ip: RandomGenerator.ip(),
        created_at,
        deleted_at: null
    });
}