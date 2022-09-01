import orm from "typeorm";

import safe from "../..";
import { BbsArticle } from "../models/bbs/BbsArticle";
import { BbsArticleContent } from "../models/bbs/BbsArticleContent";
import { BbsCategory } from "../models/bbs/BbsCategory";
import { BbsGroup } from "../models/bbs/BbsGroup";
import { BbsQuestionArticle } from "../models/bbs/BbsQuestionArticle";

export async function test_safe_query_builder(): Promise<void> {
    const group: BbsGroup = await BbsGroup.findOneOrFail();
    const category: BbsCategory = await BbsCategory.findOneOrFail();

    const stmt: orm.SelectQueryBuilder<BbsQuestionArticle> = safe
        .createJoinQueryBuilder(BbsQuestionArticle, (question) => {
            question.innerJoin("base", (article) => {
                article.innerJoin("group");
                article.innerJoin("category");
                article.innerJoin("__mv_last").innerJoin("content");
            });
            question
                .leftJoin("answer")
                .leftJoin("base", "AA")
                .leftJoin("__mv_last", "AL")
                .leftJoin("content", "AC");
        })
        .andWhere(...BbsArticle.getWhereArguments("group", group))
        .andWhere(...BbsCategory.getWhereArguments("code", "!=", category.code))
        .select([
            BbsArticle.getColumn("id"),
            BbsGroup.getColumn("name", "group"),
            BbsCategory.getColumn("name", "category"),
            BbsArticle.getColumn("writer"),
            BbsArticleContent.getColumn("title"),
            BbsArticle.getColumn("created_at"),
            BbsArticleContent.getColumn("created_at", "updated_at"),

            BbsArticle.getColumn("AA.writer", "answer_writer"),
            BbsArticleContent.getColumn("AA.title", "answer_title"),
            BbsArticle.getColumn("AA.created_at", "answer_created_at"),
        ]);
    stmt;
}
