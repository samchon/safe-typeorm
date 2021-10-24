import * as orm from "typeorm";
import safe from "../../..";

import { BbsArticle } from "../bbs/BbsArticle";
import { BlogUser } from "./BlogUser";

@orm.Unique(["blog_user_id", "bbs_article_id"])
@orm.Entity()
export class BlogUserScrap extends safe.Model
{
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @safe.Belongs.ManyToOne(() => BlogUser,
        user => user.scraps, 
        "uuid",
        "blog_user_id",
        // INDEXED
    )
    public readonly user!: safe.Belongs.ManyToOne<BlogUser, "uuid">;

    @safe.Belongs.External.ManyToOne(() => BbsArticle,
        article => article.scraps,
        "uuid",
        "bbs_article_id",
        { index: true }
    )
    public readonly article!: safe.Belongs.External.ManyToOne<BbsArticle, "uuid">;

    @orm.CreateDateColumn()
    public readonly created_at!: Date;
}