import * as orm from "typeorm";
import { Has } from "../../decorators/Has";
import { IncrementalColumn } from "../../decorators/IncrementalColumn";
import { Model } from "../../Model";
import { BbsArticleCover } from "./BbsArticleCover";
import { BbsArticleFilePair } from "./BbsArticleFilePair";

@orm.Entity()
export class AttachmentFile extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @IncrementalColumn()
    public id!: number;

    @orm.Column("varchar")
    public name!: string;

    @orm.Column("varchar")
    public extension!: string;

    @orm.Column("varchar", { length: 1000 })
    public path!: string;

    @orm.CreateDateColumn()
    public created_at!: Date;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @Has.OneToMany(() => BbsArticleCover, "file")
    public articleCover!: Has.OneToMany<BbsArticleCover>;

    @Has.OneToMany(() => BbsArticleFilePair, "file")
    public articlePairs!: Has.OneToMany<BbsArticleFilePair>;
}