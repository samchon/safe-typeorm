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
        "int",
        "bbs_article_id",
        { index: true }
    )
    public article!: Belongs.ManyToOne<BbsArticle, "int">;

    @Belongs.ManyToOne(() => BbsComment, 
        parent => parent.children, 
        "int",
        "pid", 
        { index: true, nullable: true }
    )
    public parent!: Belongs.ManyToOne<BbsComment, "int">;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @Has.OneToMany(() => BbsComment, child => child.parent)
    public children!: Has.OneToMany<BbsComment>;
}