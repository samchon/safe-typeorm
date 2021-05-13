import * as orm from "typeorm";
import { Model } from "../../Model";

import { Belongs } from "../../decorators/Belongs";

import { AttachmentFile } from "./AttachmentFile";
import { BbsArticle } from "./BbsArticle";
import { v4 } from "uuid";

@orm.Entity()
export class BbsArticleFilePair extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public id: string = v4();

    @Belongs.ManyToOne(() => BbsArticle, 
        "uuid",
        "bbs_article_id"
    )
    public article!: Belongs.ManyToOne<BbsArticle, "uuid">;

    @Belongs.ManyToOne(() => AttachmentFile,
        "uuid",
        "attachment_file_id",
        { index: true }
    )
    public file!: Belongs.ManyToOne<AttachmentFile, "uuid">;
}