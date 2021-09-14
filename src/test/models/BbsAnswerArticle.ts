import * as orm from "typeorm";
import safe from "../..";

import { BbsArticle } from "./BbsArticle";
import { BbsQuestionArticle } from "./BbsQuestionArticle";

@orm.Entity()
export class BbsAnswerArticle extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.OneToOne(() => BbsArticle,
        article => article.answer,
        "uuid",
        "id",
        { primary: true }
    )
    public readonly base!: safe.Belongs.OneToOne<BbsArticle, "uuid">;

    @safe.Belongs.OneToOne(() => BbsQuestionArticle,
        question => question.answer,
        "uuid",
        "id",
        { unique: true }
    )
    public readonly question!: safe.Belongs.OneToOne<BbsQuestionArticle, "uuid">;
}