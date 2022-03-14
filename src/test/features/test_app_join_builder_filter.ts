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

export async function test_app_join_builder_filter(): Promise<void>
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

    // TEST-APP-JOIN
    const app = new safe.AppJoinBuilder(BbsGroup);
    app.join(["articles" as const, filter]);
    await app.execute(groupList);
    await test(groupList);

    const reloaded: BbsGroup[] = await BbsGroup.findByIds(groupList.map(g => g.id));
    const json = safe.createJsonSelectBuilder(BbsGroup, {
        articles: ["join" as const, filter]
    });
    await json.join(reloaded);
    await test(reloaded);
}