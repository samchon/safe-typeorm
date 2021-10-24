import safe from "../..";
import { collect_random_external_db } from "../internal/collectors/collect_random_external_db";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";

export async function test_external_insert_collection(): Promise<void>
{
    const collection: safe.InsertCollection = new safe.InsertCollection();
    const { group, users } = await collect_random_external_db(collection);

    await collection.execute();

    await must_not_query_anything("external_insert_collection", async () =>
    {
        for (const article of await group.articles.get())
            await article.scraps.get();

        for (const user of users)
            for (const scrap of await user.scraps.get())
            {
                await scrap.user.get();
                await scrap.article.get();
            }
    });
}