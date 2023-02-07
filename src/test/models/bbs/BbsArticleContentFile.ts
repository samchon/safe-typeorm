import safe from "safe-typeorm";
import * as orm from "typeorm";

import { BbsArticleContent } from "./BbsArticleContent";
import { AttachmentFilePairBase } from "./internal/AttachmentFilePairBase";

@orm.Unique(["bbs_article_content_id", "attachment_file_id"])
@orm.Entity()
export class BbsArticleContentFile extends AttachmentFilePairBase {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.ManyToOne(
        () => BbsArticleContent,
        "uuid",
        "bbs_article_content_id",
        // INDEXED
    )
    public readonly content!: safe.Belongs.ManyToOne<BbsArticleContent, "uuid">;
}
