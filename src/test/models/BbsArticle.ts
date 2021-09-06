import * as orm from "typeorm";
import safe from "../..";

import { BbsArticleContent } from "./BbsArticleContent";
import { BbsArticleTag } from "./BbsArticleTag";
import { BbsCategory } from "./BbsCategory";
import { BbsComment } from "./BbsComment";

import { BbsGroup } from "./BbsGroup";
import { BbsReviewArticle } from "./BbsReviewArticle";
import { BbsWriterBase } from "./internal/BbsWriterBase";

@orm.Index(["bbs_group_id", "bbs_category_id", "created_at"])
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

    @safe.Belongs.ManyToOne(() => BbsCategory,
        category => category.articles,
        "uuid",
        "bbs_category_id",
        { index: true, nullable: true }
    )
    public readonly category!: safe.Belongs.ManyToOne<BbsCategory, "uuid", { nullable: true }>;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToOne
    (
        () => BbsReviewArticle,
        review => review.base,
    )
    public readonly review!: safe.Has.OneToOne<BbsReviewArticle>;

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

    @safe.Has.OneToMany
    (
        () => BbsArticleTag,
        tag => tag.article,
        (x, y) => x.value < y.value ? -1 : 1
    )
    public readonly tags!: safe.Has.OneToMany<BbsArticleTag>;
}