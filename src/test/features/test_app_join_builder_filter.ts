import * as orm from "typeorm";

import safe from "../..";
import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";
import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsGroup } from "../models/bbs/BbsGroup";

export async function test_app_join_builder_filter(): Promise<void> {
    // FILTERING
    const groupList: BbsGroup[] = await generate_random_clean_groups();
    const articleList: BbsArticle[] = [];

    for (const group of groupList) {
        const articles: BbsArticle[] = await group.articles.get();
        articleList.push(articles[0]);
    }
    const filter = (stmt: orm.SelectQueryBuilder<BbsArticle>) => {
        stmt.andWhere(...BbsArticle.getWhereArguments("id", "IN", articleList));
    };

    // APP JOIN WITH FILTER
    const app = new safe.AppJoinBuilder(BbsGroup);
    app.join(["articles" as const, filter]);
    await app.execute(groupList);

    // DO TEST
    for (const group of groupList) {
        const articles: BbsArticle[] = await group.articles.get();
        if (articles.length !== 1)
            throw new Error(
                "Bug on AppJoinBuilder.execute(): failed to filter.",
            );
    }
}
