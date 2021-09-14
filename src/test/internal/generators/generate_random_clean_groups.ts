import { BbsGroup } from "../../models/BbsGroup";

import { ArrayUtil } from "../../../utils/ArrayUtil";
import { generate_random_empty_review_bbs_group } from "./generate_random_empty_review_bbs_group";
import { generate_random_normal_bbs_group } from "./generate_random_normal_bbs_group";
import { generate_random_review_bbs_group } from "./generate_random_review_bbs_group";

const GENERATORS = [
    generate_random_normal_bbs_group,
    generate_random_review_bbs_group,
    generate_random_empty_review_bbs_group,
];

export function generate_random_clean_groups(): Promise<BbsGroup[]>
{
    return ArrayUtil.asyncMap(GENERATORS, async generator =>
    {
        const group: BbsGroup = await generator();
        return BbsGroup.findOneOrFail(group.id);
    });
}

