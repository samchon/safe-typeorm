import safe from "safe-typeorm";
import * as orm from "typeorm";

import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsReviewArticle extends safe.Model {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.OneToOne(
        () => BbsArticle,
        (article) => article.review,
        "uuid",
        "id",
        { primary: true },
    )
    public readonly base!: safe.Belongs.OneToOne<BbsArticle, "uuid">;

    @orm.Column("varchar")
    public readonly manufacturer!: string;

    @orm.Column("varchar")
    public readonly product!: string;
}
