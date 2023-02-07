import safe from "safe-typeorm";
import * as orm from "typeorm";

import { BbsArticle } from "./BbsArticle";
import { BbsArticleContent } from "./BbsArticleContent";

@orm.Entity()
export class __MvBbsArticleLastContent extends safe.Model {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.OneToOne(
        () => BbsArticle,
        (article) => article.__mv_last,
        "uuid",
        "bbs_article_id",
        { primary: true },
    )
    public readonly article!: safe.Belongs.OneToOne<BbsArticle, "uuid">;

    @safe.Belongs.OneToOne(
        () => BbsArticleContent,
        "uuid",
        "bbs_article_content_id",
        { unique: true },
    )
    public readonly content!: safe.Belongs.OneToOne<BbsArticleContent, "uuid">;
}
