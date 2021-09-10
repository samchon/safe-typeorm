import * as orm from "typeorm";
import safe from "../..";

import { AttachmentFile } from "./AttachmentFile";
import { BbsArticle } from "./BbsArticle";
import { BbsCommentFilePair } from "./BbsCommentFilePair";

@orm.Index(["bbs_article_id", "created_at"])
@orm.Entity()
export class BbsComment extends safe.Model
{
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

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

    @orm.Index()
    @orm.Column("varchar")
    public readonly writer!: string;

    @orm.Column(() => safe.Password, { prefix: "" })
    public readonly password: safe.Password = new safe.Password();

    @orm.Column()
    public readonly ip!: string;

    @orm.Index()
    @orm.CreateDateColumn()
    public readonly created_at!: Date;

    @orm.DeleteDateColumn()
    public readonly deleted_at!: Date | null;
}