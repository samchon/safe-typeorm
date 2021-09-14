import * as orm from "typeorm";
import safe from "../..";

import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsReviewArticle extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.OneToOne(() => BbsArticle,
        article => article.review,
        "uuid",
        "id",
        { primary: true }
    )
    public readonly base!: safe.Belongs.OneToOne<BbsArticle, "uuid">;

    @orm.Column("varchar")
    public readonly manufacturer!: string

    @orm.Column("varchar")
    public readonly product!: string;

    @orm.Column("double")
    public readonly price!: number;

    @orm.Column("double")
    public readonly score!: number;
}