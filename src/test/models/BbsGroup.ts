import * as orm from "typeorm";
import safe from "../..";
import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsGroup extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @orm.Index({ unique: true })
    @orm.Column("varchar")
    public readonly code!: string;

    @orm.Column("varchar")
    public readonly name!: string;

    @orm.Index()
    @orm.CreateDateColumn()
    public readonly created_at!: Date;

    @orm.DeleteDateColumn()
    public readonly deleted_at!: Date | null;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToMany
    (
        () => BbsArticle, 
        article => article.group,
        (x, y) => x.created_at.getTime() - y.created_at.getTime()
    )
    public readonly articles!: safe.Has.OneToMany<BbsArticle>;
}