import * as orm from "typeorm";

import safe from "../../..";
import { BbsArticle } from "./BbsArticle";

@orm.Unique(["bbs_article_id", "value"])
@orm.Entity()
export class BbsArticleTag extends safe.Model {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @safe.Belongs.ManyToOne(
        () => BbsArticle,
        (article) => article.tags,
        "uuid",
        "bbs_article_id",
        // INDEXED
    )
    public readonly article!: safe.Belongs.ManyToOne<BbsArticle, "uuid">;

    @orm.Column("varchar")
    public readonly value!: string;
}
