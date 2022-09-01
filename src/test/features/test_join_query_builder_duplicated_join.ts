import safe from "../..";
import { generate_random_normal_bbs_group } from "../internal/generators/generate_random_normal_bbs_group";
import { BbsGroup } from "../models/bbs/BbsGroup";

export async function test_join_query_builder_duplicated_join(): Promise<void> {
    const group: BbsGroup = await generate_random_normal_bbs_group();
    const stmt = BbsGroup.createQueryBuilder();
    const builder = new safe.JoinQueryBuilder(stmt, BbsGroup);

    builder.innerJoin("articles", (article) => {
        article.innerJoin("__mv_last").innerJoin("content");
        article.innerJoin("comments");
        article.innerJoin("tags");
    });
    builder.innerJoin("articles");
    builder.innerJoin("articles", (article) => {
        article.innerJoin("comments");
    });
    builder.innerJoin("articles", (article) => {
        article.innerJoin("category");
        article.innerJoin("tags");
    });

    stmt.andWhere(...BbsGroup.getWhereArguments("code", group.code));
    console.log(stmt.getQuery());
    await stmt.getMany();
}