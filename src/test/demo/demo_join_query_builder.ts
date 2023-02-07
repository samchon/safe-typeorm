import safe from "safe-typeorm";
import * as orm from "typeorm";

import { BbsGroup } from "../models/bbs/BbsGroup";
import { BbsQuestionArticle } from "../models/bbs/BbsQuestionArticle";

export function demo_join_query_builder(
    group: BbsGroup,
    exclude: string[],
): orm.SelectQueryBuilder<BbsQuestionArticle> {
    const question = safe.createJoinQueryBuilder(BbsQuestionArticle);

    // JOIN
    const article = question.innerJoin("base");
    const content = article.innerJoin("__mv_last").innerJoin("content");
    const category = article.innerJoin("category");

    // SELECT
    article.addSelect("id").addSelect("writer").addSelect("created_at");
    content.addSelect("title").addSelect("created_at", "updated_at");
    article.leftJoin("answer").leftJoin("base", "AA", (answer) => {
        answer.addSelect("writer", "answer_writer");
        answer.addSelect("created_at", "answer_created_at");
        answer
            .leftJoin("__mv_last", "AL")
            .leftJoin("content", "AC")
            .addSelect(
                ["title", (str) => `COALESCE(${str}, 'NONE')`],
                "answer_title",
            );
    });
    content.addOrderBy("created_at", "DESC");

    // WHERE
    article.andWhere("group", group);
    category.andWhere("code", "NOT IN", exclude);
    return question.statement();
}
