import safe from "safe-typeorm";

import { ArrayUtil } from "../../../utils/ArrayUtil";
import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsGroup } from "../../models/bbs/BbsGroup";
import { BlogUser } from "../../models/blog/BlogUser";
import { BlogUserScrap } from "../../models/blog/BlogUserScrap";
import { prepare_random_bbs_group } from "../preparations/prepare_random_bbs_group";
import { RandomGenerator } from "../procedures/RandomGenerator";
import { collect_random_bbs_article } from "./collect_random_bbs_article";

export async function collect_random_external_db(
    collection: safe.InsertCollection,
): Promise<IOutput> {
    const group: BbsGroup = prepare_random_bbs_group();
    collection.push(group);

    const articles: BbsArticle[] = await ArrayUtil.asyncRepeat(5, (index) =>
        collect_random_bbs_article(
            collection,
            group,
            new Date(Date.now() + index * 1000),
        ),
    );
    await group.articles.set(articles);

    const users: BlogUser[] = await ArrayUtil.asyncRepeat(5, async () => {
        const u: BlogUser = BlogUser.initialize({
            id: safe.DEFAULT,
            email: `${RandomGenerator.alphabets(8)}@samchon.org`,
            created_at: safe.DEFAULT,
        });
        await u.password.set(RandomGenerator.alphabets(8));
        return u;
    });
    collection.push(users);

    for (const a of articles) await a.scraps.set([]);
    for (const u of users) {
        const scraps: BlogUserScrap[] = [];
        for (const a of articles) {
            const s: BlogUserScrap = BlogUserScrap.initialize({
                id: safe.DEFAULT,
                user: u,
                article: a,
                created_at: safe.DEFAULT,
            });
            scraps.push(s);
            (await a.scraps.get()).push(s);
        }
        await u.scraps.set(scraps);
        collection.push(scraps);
    }
    return { group, users };
}

interface IOutput {
    group: BbsGroup;
    users: BlogUser[];
}
