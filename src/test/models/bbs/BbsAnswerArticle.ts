import safe from "safe-typeorm";
import * as orm from "typeorm";

import { BbsArticle } from "./BbsArticle";
import { BbsQuestionArticle } from "./BbsQuestionArticle";

@orm.Entity()
export class BbsAnswerArticle extends safe.Model {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.OneToOne(
        () => BbsArticle,
        (article) => article.answer,
        "uuid",
        "id",
        { primary: true },
    )
    public readonly base!: safe.Belongs.OneToOne<BbsArticle, "uuid">;

    @safe.Belongs.OneToOne(
        () => BbsQuestionArticle,
        (question) => question.answer,
        "uuid",
        "bbs_question_id",
        { unique: true },
    )
    public readonly question!: safe.Belongs.OneToOne<
        BbsQuestionArticle,
        "uuid"
    >;
}
