import * as orm from "typeorm";
import { Model } from "../../Model";

import { Belongs } from "../../decorators/Belongs";
import { IncrementalColumn } from "../../decorators/IncrementalColumn";

import { AttachmentFile } from "./AttachmentFile";
import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsArticleFilePair extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @IncrementalColumn()
    public id!: number;

    @Belongs.ManyToOne(() => BbsArticle, 
        "filePairs", 
        "bbs_article_id"
    )
    public article!: Belongs.ManyToOne<BbsArticle>;

    @Belongs.ManyToOne(() => AttachmentFile,
        "articlePairs",
        "attachment_file_id"
    )
    public file!: Belongs.ManyToOne<AttachmentFile>;
}