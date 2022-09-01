import safe from "../../..";
import { ArrayUtil } from "../../../utils/ArrayUtil";
import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsGroup } from "../../models/bbs/BbsGroup";
import { BbsReviewArticle } from "../../models/bbs/BbsReviewArticle";
import { collect_random_bbs_article } from "../collectors/collect_random_bbs_article";
import { collect_random_bbs_review_article } from "../collectors/collect_random_bbs_review_article";
import { prepare_random_bbs_group } from "../preparations/prepare_random_bbs_group";

export async function generate_random_bbs_review_articles(): Promise<
    BbsReviewArticle[]
> {
    const collection: safe.InsertCollection = new safe.InsertCollection();
    const group: BbsGroup = prepare_random_bbs_group();
    collection.push(group);

    const articleList: BbsArticle[] = [];
    const reviewList: BbsReviewArticle[] = [];

    await ArrayUtil.asyncRepeat(10, async () => {
        const article: BbsArticle = await collect_random_bbs_article(
            collection,
            group,
        );
        const review: BbsReviewArticle =
            await collect_random_bbs_review_article(collection, article);

        articleList.push(article);
        reviewList.push(review);
    });
    await group.articles.set(articleList);

    await collection.execute();

    return BbsReviewArticle.findByIds(reviewList.map((r) => r.base.id));
}
