import { collect_random_bbs_review_article } from "../collectors/collect_random_bbs_review_article";
import { BbsGroup } from "../models/BbsGroup";
import { __generate_random_bbs_group } from "./internal/__generate_random_bbs_group";

export function generate_random_empty_review_bbs_group(): Promise<BbsGroup>
{
    return __generate_random_bbs_group
    (
        (collection, article) => collect_random_bbs_review_article
        (
            collection, 
            article, 
            false
        )
    );
}