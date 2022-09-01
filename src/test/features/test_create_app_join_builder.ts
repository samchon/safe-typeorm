import safe from "../..";
import { generate_random_bbs_review_articles as generate_random_reviews } from "../internal/generators/generate_random_bbs_review_articles";
import { iterate_bbs_review_article } from "../internal/iterators/iterate_bbs_review_article";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";
import { BbsReviewArticle } from "../models/bbs/BbsReviewArticle";

export async function test_create_app_join_builder(): Promise<void> {
    const builder: safe.AppJoinBuilder<BbsReviewArticle> =
        safe.createAppJoinBuilder(BbsReviewArticle, (review) => {
            review.join("base", (article) => {
                article.join("group");
                article.join("category").join("parent");
                article.join("contents", (content) => {
                    content.join("reviewContent");
                    content.join("files");
                });
                article.join("comments").join("files");
                article.join("tags");
            });
        });

    const reviews: BbsReviewArticle[] = await generate_random_reviews();
    await builder.execute(reviews);

    await must_not_query_anything("createAppJoinBuilder()", async () => {
        for (const r of reviews) await iterate_bbs_review_article(r);
    });
}
