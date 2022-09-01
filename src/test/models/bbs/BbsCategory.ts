import * as orm from "typeorm";

import safe from "../../..";
import { BbsArticle } from "./BbsArticle";

@orm.Entity()
export class BbsCategory extends safe.Model {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @safe.Belongs.ManyToOne(
        () => BbsCategory,
        (parent) => parent.children,
        "uuid",
        "parent_id",
        { index: true, nullable: true },
    )
    public readonly parent!: safe.Belongs.ManyToOne<
        BbsCategory,
        "uuid",
        { nullable: true }
    >;

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
    @safe.Has.OneToMany(
        () => BbsArticle,
        (article) => article.category,
        (x, y) => x.created_at.getTime() - y.created_at.getTime(),
    )
    public readonly articles!: safe.Has.OneToMany<BbsArticle>;

    @safe.Has.OneToMany(
        () => BbsCategory,
        (child) => child.parent,
        (x, y) => x.created_at.getTime() - y.created_at.getTime(),
    )
    public readonly children!: safe.Has.OneToMany<BbsCategory>;
}
