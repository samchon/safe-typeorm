import { BbsGroup } from "../models/bbs/BbsGroup";

import { iterate_bbs_group } from "../internal/iterators/iterate_bbs_group";
import { generate_random_normal_bbs_group } from "../internal/generators/generate_random_normal_bbs_group";

export async function test_relation_getter(): Promise<void>
{
    let group: BbsGroup = await generate_random_normal_bbs_group();
    group = await BbsGroup.findOneOrFail(group.id);

    await iterate_bbs_group(group, false);
}