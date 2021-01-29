import * as orm from "typeorm";
import { Model } from "../../Model";

import { Belongs } from "../../decorators/Belongs";

import { AttachmentFile } from "./AttachmentFile";
import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsArticleCover extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn()
    public readonly id!: number;

    @Belongs.OneToOne(() => BbsArticle, 
        article => article.cover, 
        "int", 
        "bbs_article_id",
        { unique: true }
    )
    public article!: Belongs.ManyToOne<BbsArticle, "int">;

    @Belongs.ManyToOne(() => AttachmentFile,
        file => file.articleCover,
        "int",
        "attachment_file_id",
        { index: true }
    )
    public file!: Belongs.ManyToOne<AttachmentFile, "int">;

    @orm.Column("varchar")
    public sub_title!: string;
}