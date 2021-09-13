import safe from "../..";
import { ArrayUtil } from "../../utils/ArrayUtil";
import { RandomGenerator } from "../internal/RandomGenerator";
import { BbsCategory } from "../models/BbsCategory";

async function collect_category
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
            () => collect_category(collection, category, limit, level + 1)
        );
        await category.children.set(children);
    }
    else
        await category.children.set([]);
    return category;
}

export async function generate_random_recursive_category
    (limit: number = 0): Promise<BbsCategory>
{
    const collection: safe.InsertCollection = new safe.InsertCollection();
    const top: BbsCategory = await collect_category(collection, null, limit);
    await collection.execute();
    
    return await BbsCategory.findOneOrFail(top.id);
}