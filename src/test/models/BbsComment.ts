import * as orm from "typeorm";

import { Belongs } from "../../decorators/Belongs";
import { Has } from "../../decorators/Has";

import { BbsContentBase } from "./base/BbsContentBase";
import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsComment extends BbsContentBase
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @Belongs.ManyToOne(() => BbsArticle,
        article => article.comments,
        "uuid",
        "bbs_article_id",
        { index: true }
    )
    public article!: Belongs.ManyToOne<BbsArticle, "uuid">;

    @Belongs.ManyToOne(() => BbsComment, 
        parent => parent.children, 
        "uuid",
        "pid", 
        { index: true, nullable: true }
    )
    public parent!: Belongs.ManyToOne<BbsComment, "uuid", { nullable: true }>;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @Has.OneToMany(() => BbsComment, child => child.parent)
    public children!: Has.OneToMany<BbsComment>;
}