import * as orm from "typeorm";
import { Model } from "../../Model";

import { Belongs } from "../../decorators/Belongs";
import { IncrementalColumn } from "../../decorators/IncrementalColumn";

import { AttachmentFile } from "./AttachmentFile";
import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsArticleCover extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @IncrementalColumn()
    public readonly id!: number;

    @Belongs.OneToOne(() => BbsArticle, 
        "cover", 
        "bbs_article_id", 
        { unique: true }
    )
    public article!: Belongs.ManyToOne<BbsArticle>;

    @Belongs.ManyToOne(() => AttachmentFile,
        "articleCover",
        "attachment_file_id",
        { index: true }
    )
    public file!: Belongs.ManyToOne<AttachmentFile>;

    @orm.Column("varchar")
    public sub_title!: string;
}