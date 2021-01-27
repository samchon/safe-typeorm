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
        "comments",
        "bbs_article_id",
        { index: true }
    )
    public article!: Belongs.ManyToOne<BbsArticle>;

    @Belongs.ManyToOne(() => BbsComment, 
        "children", 
        "pid", 
        { index: true, nullable: true }
    )
    public parent!: Belongs.ManyToOne<BbsComment>;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    public children!: Has.OneToMany<BbsComment>;
}