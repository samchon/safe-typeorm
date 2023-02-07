import safe from "safe-typeorm";
import * as orm from "typeorm";

import { BbsComment } from "./BbsComment";
import { AttachmentFilePairBase } from "./internal/AttachmentFilePairBase";

@orm.Unique(["bbs_comment_id", "attachment_file_id"])
@orm.Entity()
export class BbsCommentFile extends AttachmentFilePairBase {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.ManyToOne(
        () => BbsComment,
        "uuid",
        "bbs_comment_id",
        // INDEXED
    )
    public readonly comment!: safe.Belongs.ManyToOne<BbsComment, "uuid">;
}
