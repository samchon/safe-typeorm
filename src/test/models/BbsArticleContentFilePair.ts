import * as orm from "typeorm";
import safe from "../..";

import { AttachmentFilePairBase } from "./internal/AttachmentFilePairBase";
import { BbsArticleContent } from "./BbsArticleContent";

@orm.Index(["bbs_article_content_id", "sequence"])
@orm.Entity()
export class BbsArticleContentFilePair extends AttachmentFilePairBase
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.ManyToOne(() => BbsArticleContent, 
        "uuid",
        "bbs_article_content_id",
        // INDEXED
    )
    public readonly content!: safe.Belongs.ManyToOne<BbsArticleContent, "uuid">;
}