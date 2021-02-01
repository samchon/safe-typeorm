import * as orm from "typeorm";

import { Belongs } from "../../decorators/Belongs";
import { Has } from "../../decorators/Has";
import { AttachmentFile } from "./AttachmentFile";

import { BbsContentBase } from "./base/BbsContentBase";
import { BbsArticleCover } from "./BbsArticleCover";
import { BbsArticleFilePair } from "./BbsArticleFilePair";
import { BbsComment } from "./BbsComment";
import { BbsGroup } from "./BbsGroup";

@orm.Entity()
export class BbsArticle extends BbsContentBase
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @Belongs.ManyToOne(() => BbsGroup, 
        group => group.articles,
        "int", 
        "bbs_group_id",
        { index: true })
    public group!: Belongs.ManyToOne<BbsGroup, "int">;

    @Belongs.ManyToOne(() => BbsArticle,
        parent => parent.children,
        "int",
        "pid",
        { index: true, nullable: true }
    )
    public parent!: Belongs.ManyToOne<BbsArticle, "int", { nullable: true }>;

    @orm.Column("varchar")
    public title!: string;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @Has.OneToMany(() => BbsArticle, child => child.parent)
    public children!: Has.OneToMany<BbsArticle>;
    
    @Has.ManyToMany(() => AttachmentFile, 
        () => BbsArticleFilePair, 
        router => router.file, 
        router => router.article
    )
    public files!: Has.ManyToMany<AttachmentFile>;

    @Has.OneToOne(() => BbsArticleCover, cover => cover.article)
    public cover!: Has.OneToOne<BbsArticleCover>;

    @Has.OneToMany(() => BbsComment, comment => comment.article)
    public comments!: Has.OneToMany<BbsComment>;
}