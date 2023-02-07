import safe from "safe-typeorm";

import { generate_random_external_db } from "../internal/generators/generate_random_external_db";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";
import { BbsGroup } from "../models/bbs/BbsGroup";

export async function test_external_app_join_builder(): Promise<void> {
    const { group } = await generate_random_external_db();
    const builder = safe.createAppJoinBuilder(BbsGroup, (group) =>
        group.join("articles").join("scraps").join("user"),
    );
    await builder.execute(group);

    await must_not_query_anything("external_app_join", async () => {
        for (const article of await group.articles.get())
            for (const scrap of await article.scraps.get()) {
                await scrap.user.get();
                await scrap.article.get();
            }
    });
}
