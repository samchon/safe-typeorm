import * as orm from "typeorm";
import safe from "../..";
import { AttachmentFile } from "./AttachmentFile";

import { BbsArticle } from "./BbsArticle";
import { BbsCommentFilePair } from "./BbsCommentFilePair";
import { BbsWriterBase } from "./internal/BbsWriterBase";

@orm.Index(["bbs_article_id", "created_at"])
@orm.Entity()
export class BbsComment extends BbsWriterBase
{
    @safe.Belongs.ManyToOne(() => BbsArticle,
        article => article.comments,
        "uuid",
        "bbs_article_id",
        // INDEXED
    )
    public readonly article!: safe.Belongs.ManyToOne<BbsArticle, "uuid">;

    @orm.Column("text")
    public readonly content!: string;

    @safe.Has.ManyToMany
    (
        () => AttachmentFile,
        () => BbsCommentFilePair,
        router => router.file,
        router => router.comment,
        (x, y) => x.router.sequence  - y.router.sequence
    )
    public readonly files!: safe.Has.ManyToMany<AttachmentFile, BbsCommentFilePair>;
}