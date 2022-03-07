import * as orm from "typeorm";
import safe from "../..";

import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsGroup } from "../models/bbs/BbsGroup";
import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";

async function test(groupList: BbsGroup[]): Promise<void>
{
    for (const group of groupList)
    {
        const articles: BbsArticle[] = await group.articles.get();
        if (articles.length !== 1)
            throw new Error("Bug on AppJoinBuilder.execute(): failed to filter.");
    }
}

export async function app_join_builder_filter(): Promise<void>
{
    const groupList: BbsGroup[] = await generate_random_clean_groups();
    const articleList: BbsArticle[] = [];

    for (const group of groupList)
    {
        const articles: BbsArticle[] = await group.articles.get();
        articleList.push(articles[0]);
    }
    const filter = (stmt: orm.SelectQueryBuilder<BbsArticle>) =>
    {
        stmt.andWhere(...BbsArticle.getWhereArguments("id", "IN", articleList));
    };

    const app = new safe.AppJoinBuilder(BbsGroup);
    await app.execute(groupList);
    await test(groupList);

    const json = safe.createJsonSelectBuilder(BbsGroup, {
        articles: ["join" as const, filter]
    });
    await json.join(groupList);
    await test(groupList);
}