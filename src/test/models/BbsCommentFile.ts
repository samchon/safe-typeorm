import * as orm from "typeorm";
import safe from "../..";

import { AttachmentFilePairBase } from "./internal/AttachmentFilePairBase";
import { BbsComment } from "./BbsComment";

@orm.Unique(["bbs_comment_id", "attachment_file_id"])
@orm.Entity()
export class BbsCommentFile extends AttachmentFilePairBase
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