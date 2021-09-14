import { BbsGroup } from "../../models/BbsGroup";
import { __generate_random_bbs_group } from "./__generate_random_bbs_group";

export function generate_random_normal_bbs_group(): Promise<BbsGroup>
{
    return __generate_random_bbs_group(async () => null);
}