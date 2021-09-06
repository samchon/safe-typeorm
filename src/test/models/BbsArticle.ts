import * as orm from "typeorm";
import safe from "../..";
import { BbsArticleContent } from "./BbsArticleContent";
import { BbsComment } from "./BbsComment";

import { BbsGroup } from "./BbsGroup";
import { BbsWriterBase } from "./internal/BbsWriterBase";

@orm.Index(["bbs_group_id", "created_at"])
@orm.Entity()
export class BbsArticle extends BbsWriterBase
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.ManyToOne(() => BbsGroup,
        group => group.articles,
        "uuid",
        "bbs_group_id",
        // INDEXED
    )
    public readonly group!: safe.Belongs.ManyToOne<BbsGroup, "uuid">;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToMany
    (
        () => BbsComment,
        comment => comment.article,
        (x, y) => x.created_at.getTime() - y.created_at.getTime(),
    )
    public readonly comments!: safe.Has.OneToMany<BbsComment>;

    @safe.Has.OneToMany
    (
        () => BbsArticleContent,
        content => content.article,
        (x, y) => x.created_at.getTime() - y.created_at.getTime(),
    )
    public readonly contents!: safe.Has.OneToMany<BbsArticleContent>;
}