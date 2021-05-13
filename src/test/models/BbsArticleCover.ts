import * as orm from "typeorm";
import { Model } from "../../Model";

import { Belongs } from "../../decorators/Belongs";

import { AttachmentFile } from "./AttachmentFile";
import { BbsArticle } from "./BbsArticle";
import { v4 } from "uuid";

@orm.Entity()
export class BbsArticleCover extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public id: string = v4();

    @Belongs.OneToOne(() => BbsArticle, 
        article => article.cover, 
        "uuid", 
        "bbs_article_id",
        { unique: true }
    )
    public article!: Belongs.ManyToOne<BbsArticle, "uuid">;

    @Belongs.ManyToOne(() => AttachmentFile,
        file => file.articleCover,
        "uuid",
        "attachment_file_id",
        { index: true }
    )
    public file!: Belongs.ManyToOne<AttachmentFile, "uuid">;

    @orm.Column("varchar")
    public sub_title!: string;
}