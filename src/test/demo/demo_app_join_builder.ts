import safe from "safe-typeorm";

import { BbsReviewArticle } from "../models/bbs/BbsReviewArticle";

export async function test_app_join_builder_initialize(
    reviews: BbsReviewArticle[],
): Promise<void> {
    const builder = safe.createAppJoinBuilder(BbsReviewArticle, (review) => {
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
    await builder.execute(reviews);
}
