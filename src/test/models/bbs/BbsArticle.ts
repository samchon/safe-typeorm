import safe from "safe-typeorm";
import * as orm from "typeorm";

import { BlogUserScrap } from "../blog/BlogUserScrap";
import { BbsAnswerArticle } from "./BbsAnswerArticle";
import { BbsArticleContent } from "./BbsArticleContent";
import { BbsArticleTag } from "./BbsArticleTag";
import { BbsCategory } from "./BbsCategory";
import { BbsComment } from "./BbsComment";
import { BbsGroup } from "./BbsGroup";
import { BbsQuestionArticle } from "./BbsQuestionArticle";
import { BbsReviewArticle } from "./BbsReviewArticle";
import { __MvBbsArticleLastContent } from "./__MvBbsArticleLastContent";

@orm.Index(["bbs_group_id", "bbs_category_id", "created_at"])
@orm.Entity()
export class BbsArticle extends safe.Model {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @safe.Belongs.ManyToOne(
        () => BbsGroup,
        (group) => group.articles,
        "uuid",
        "bbs_group_id",
        // INDEXED
    )
    public readonly group!: safe.Belongs.ManyToOne<BbsGroup, "uuid">;

    @safe.Belongs.ManyToOne(
        () => BbsCategory,
        (category) => category.articles,
        "uuid",
        "bbs_category_id",
        { index: true, nullable: true },
    )
    public readonly category!: safe.Belongs.ManyToOne<
        BbsCategory,
        "uuid",
        { nullable: true }
    >;

    @orm.Index()
    @orm.Column("varchar")
    public readonly writer!: string;

    @orm.Column(() => safe.Password, { prefix: "" })
    public readonly password: safe.Password = new safe.Password();

    @orm.Column()
    public readonly ip!: string;

    @orm.Index()
    @orm.CreateDateColumn()
    public readonly created_at!: Date;

    @orm.DeleteDateColumn()
    public readonly deleted_at!: Date | null;

    /* -----------------------------------------------------------
        SUB-TYPES
    ----------------------------------------------------------- */
    @safe.Has.OneToOne(() => BbsReviewArticle, (review) => review.base)
    public readonly review!: safe.Has.OneToOne<BbsReviewArticle>;

    @safe.Has.OneToOne(() => BbsQuestionArticle, (question) => question.base)
    public readonly question!: safe.Has.OneToOne<BbsQuestionArticle>;

    @safe.Has.OneToOne(() => BbsAnswerArticle, (answer) => answer.base)
    public readonly answer!: safe.Has.OneToOne<BbsAnswerArticle>;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToMany(
        () => BbsComment,
        (comment) => comment.article,
        (x, y) => x.created_at.getTime() - y.created_at.getTime(),
    )
    public readonly comments!: safe.Has.OneToMany<BbsComment>;

    @safe.Has.OneToMany(
        () => BbsArticleContent,
        (content) => content.article,
        (x, y) => x.created_at.getTime() - y.created_at.getTime(),
    )
    public readonly contents!: safe.Has.OneToMany<BbsArticleContent>;

    @safe.Has.OneToMany(
        () => BbsArticleTag,
        (tag) => tag.article,
        (x, y) => (x.value < y.value ? -1 : 1),
    )
    public readonly tags!: safe.Has.OneToMany<BbsArticleTag>;

    @safe.Has.External.OneToMany(() => BlogUserScrap, (scrap) => scrap.article)
    public readonly scraps!: safe.Has.External.OneToMany<BlogUserScrap>;

    @safe.Has.OneToOne(() => __MvBbsArticleLastContent, (pair) => pair.article)
    public readonly __mv_last!: safe.Has.OneToOne<
        __MvBbsArticleLastContent,
        true
    >;
}
