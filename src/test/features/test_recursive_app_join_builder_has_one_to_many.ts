import safe from "../..";
import { generate_random_recursive_category } from "../internal/generators/generate_radom_recursive_category";
import { must_not_query_anything } from "../internal/procedures/must_not_query_anything";
import { BbsCategory } from "../models/bbs/BbsCategory";

async function iterate(category: BbsCategory): Promise<void> {
    for (const child of await category.children.get()) await iterate(child);
}

export async function test_recursive_app_join_builder_has_one_to_many(): Promise<void> {
    const top: BbsCategory = await generate_random_recursive_category();

    await safe
        .createAppJoinBuilder(BbsCategory, (category) =>
            category.join("children"),
        )
        .execute([top]);

    await must_not_query_anything(
        "AppJoinBuilder.join() on recursive 'Has.OneToMany' relationshiop",
        () => iterate(top),
    );
}
