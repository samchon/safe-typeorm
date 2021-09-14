import * as orm from "typeorm";
import safe from "../..";
import { BbsAnswerArticle } from "./BbsAnswerArticle";

import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsQuestionArticle extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.OneToOne(() => BbsArticle,
        article => article.question,
        "uuid",
        "id",
        { primary: true }
    )
    public readonly base!: safe.Belongs.OneToOne<BbsArticle, "uuid">;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToOne
    (
        () => BbsAnswerArticle,
        answer => answer.question,
    )
    public readonly answer!: safe.Has.OneToOne<BbsAnswerArticle>;
}