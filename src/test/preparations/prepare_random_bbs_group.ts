import safe from "../..";
import { RandomGenerator } from "../internal/RandomGenerator";
import { BbsGroup } from "../models/BbsGroup";

export function prepare_random_bbs_group(): BbsGroup
{
    return BbsGroup.initialize({
        id: safe.DEFAULT,
        code: RandomGenerator.alphabets(),
        name: RandomGenerator.name(),
        created_at: safe.DEFAULT,
        deleted_at: safe.DEFAULT,
    });
}