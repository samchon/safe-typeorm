import * as orm from "typeorm";
import { Model } from "../../Model";

import { Belongs } from "../../decorators/Belongs";

import { AttachmentFile } from "./AttachmentFile";
import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsArticleFilePair extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn()
    public id!: number;

    @Belongs.ManyToOne(() => BbsArticle, 
        "int",
        "bbs_article_id"
    )
    public article!: Belongs.ManyToOne<BbsArticle, "int">;

    @Belongs.ManyToOne(() => AttachmentFile,
        "int",
        "attachment_file_id",
        { index: true }
    )
    public file!: Belongs.ManyToOne<AttachmentFile, "int">;
}