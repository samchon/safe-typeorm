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
        "articles",
        "bbs_group_id",
        { index: true })
    public group!: Belongs.ManyToOne<BbsGroup>;

    @Belongs.ManyToOne(() => BbsArticle,
        "children",
        "pid",
        { index: true, nullable: true }
    )
    public parent!: Belongs.ManyToOne<BbsArticle>;

    @orm.Column("varchar")
    public title!: string;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @Has.OneToMany(() => BbsArticle, "parent")
    public children!: Has.OneToMany<BbsArticle>;
    
    @Has.ManyToMany(() => AttachmentFile, () => BbsArticleFilePair, "file", "article")
    public files!: Has.ManyToMany<AttachmentFile>;

    @Has.OneToOne(() => BbsArticleCover, "article")
    public cover!: Has.OneToOne<BbsArticleCover>;

    @Has.OneToMany(() => BbsComment, "article")
    public comments!: Has.OneToMany<BbsComment>;
}