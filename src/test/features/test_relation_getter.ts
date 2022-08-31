import { generate_random_normal_bbs_group } from "../internal/generators/generate_random_normal_bbs_group";
import { iterate_bbs_group } from "../internal/iterators/iterate_bbs_group";
import { BbsGroup } from "../models/bbs/BbsGroup";

export async function test_relation_getter(): Promise<void> {
    const group: BbsGroup = await generate_random_normal_bbs_group();
    await iterate_bbs_group(await BbsGroup.findOneOrFail(group.id), false);
}
