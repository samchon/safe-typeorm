import { BbsGroup } from "../../models/bbs/BbsGroup";
import { collect_random_bbs_review_article } from "../collectors/collect_random_bbs_review_article";
import { __generate_random_bbs_group } from "./__generate_random_bbs_group";

export function generate_random_empty_review_bbs_group(): Promise<BbsGroup> {
    return __generate_random_bbs_group(
        async (collection, article) =>
            await collect_random_bbs_review_article(collection, article),
    );
}
