import safe from "../../..";
import { BbsCategory } from "../../models/BbsCategory";

import { ArrayUtil } from "../../../utils/ArrayUtil";
import { RandomGenerator } from "../procedures/RandomGenerator";

export async function collect_random_hierarchical_category
    (
        collection: safe.InsertCollection,
        parent: BbsCategory | null, 
        limit: number,
        level: number = 0
    ): Promise<BbsCategory>
{
    const category: BbsCategory = BbsCategory.initialize({
        id: safe.DEFAULT,
        parent,
        code: RandomGenerator.alphabets(),
        name: RandomGenerator.name(),
        created_at: safe.DEFAULT,
        deleted_at: safe.DEFAULT
    });
    collection.push(category);

    if (level < 3)
    {
        const children: BbsCategory[] = await ArrayUtil.asyncRepeat
        (
            3,
            () => collect_random_hierarchical_category(collection, category, limit, level + 1)
        );
        await category.children.set(children);
    }
    else
        await category.children.set([]);
    return category;
}