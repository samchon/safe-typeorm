import safe from "../../..";
import { BbsCategory } from "../../models/BbsCategory";

import { collect_random_hierarchical_category } from "../collectors/collect_random_hierarchical_category";

export async function generate_random_recursive_category
    (limit: number = 0): Promise<BbsCategory>
{
    const collection: safe.InsertCollection = new safe.InsertCollection();
    const top: BbsCategory = await collect_random_hierarchical_category(collection, null, limit);
    await collection.execute();
    
    return await BbsCategory.findOneOrFail(top.id);
}