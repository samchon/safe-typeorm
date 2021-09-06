import * as orm from "typeorm";
import safe from "../..";

import { AttachmentFilePairBase } from "./internal/AttachmentFilePairBase";
import { BbsComment } from "./BbsComment";

@orm.Index(["bbs_comment_id", "sequence"])
@orm.Entity()
export class BbsCommentFilePair extends AttachmentFilePairBase
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.ManyToOne(() => BbsComment, 
        "uuid",
        "bbs_comment_id",
        // INDEXED
    )
    public readonly comment!: safe.Belongs.ManyToOne<BbsComment, "uuid">;
}