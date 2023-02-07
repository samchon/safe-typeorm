import safe from "safe-typeorm";
import * as orm from "typeorm";

import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";
import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsGroup } from "../models/bbs/BbsGroup";

export async function test_json_select_builder_filter(): Promise<void> {
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

    // JSON WITH FILTER
    const json = safe.createJsonSelectBuilder(BbsGroup, {
        articles: [safe.createJsonSelectBuilder(BbsArticle, {}), filter],
    });
    for (const { articles } of await json.getMany(groupList))
        if (articles.length !== 1)
            throw new Error(
                "Bug on JsonSelectBuilder.getMany(): failed to filter.",
            );
}
