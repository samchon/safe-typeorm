import safe from "../../..";
import { BbsGroup } from "../../models/BbsGroup";

import { RandomGenerator } from "../procedures/RandomGenerator";

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