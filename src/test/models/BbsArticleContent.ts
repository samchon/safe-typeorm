import * as orm from "typeorm";
import safe from "../..";

import { AttachmentFile } from "./AttachmentFile";
import { BbsArticle } from "./BbsArticle";
import { BbsArticleContentFilePair } from "./BbsArticleContentFilePair";
import { BbsReviewArticleContent } from "./BbsReviewArticleContent";

@orm.Entity()
export class BbsArticleContent extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @safe.Belongs.ManyToOne(() => BbsArticle,
        article => article.contents,
        "uuid",
        "bbs_article_id",
        { index: true }
    )
    public readonly article!: safe.Belongs.ManyToOne<BbsArticle, "uuid">;

    @orm.Column("varchar")
    public readonly title!: string;

    @orm.Column("text")
    public readonly body!: string;

    @orm.CreateDateColumn()
    public readonly created_at!: Date;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToOne
    (
        () => BbsReviewArticleContent,
        rc => rc.base
    )
    public readonly reviewContent!: safe.Has.OneToOne<BbsReviewArticleContent>;

    @safe.Has.ManyToMany
    (
        () => AttachmentFile,
        () => BbsArticleContentFilePair,
        router => router.file,
        router => router.content,
        (x, y) => x.router.sequence - y.router.sequence
    )
    public readonly files!: safe.Has.ManyToMany<AttachmentFile, BbsArticleContentFilePair>;
}