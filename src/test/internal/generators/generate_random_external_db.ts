import safe from "safe-typeorm";

import { BbsGroup } from "../../models/bbs/BbsGroup";
import { BlogUser } from "../../models/blog/BlogUser";
import { collect_random_external_db } from "../collectors/collect_random_external_db";

export async function generate_random_external_db() {
    const collection: safe.InsertCollection = new safe.InsertCollection();
    const { group, users } = await collect_random_external_db(collection);
    await collection.execute();

    return {
        group: await BbsGroup.findOneOrFail({ id: group.id }),
        users: await BlogUser.findByIds(users.map((u) => u.id)),
    };
}
