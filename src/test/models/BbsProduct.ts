import * as orm from "typeorm";
import safe from "../..";
import { BbsReviewArticle } from "./BbsReviewArticle";

@orm.Entity()
export class BbsProduct extends safe.Model 
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @orm.Column("varchar")
    public readonly manufacturer!: string;

    @orm.Column("varchar")
    public readonly name!: string;

    @orm.Column("double")
    public readonly price!: number;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToOne
    (
        () => BbsReviewArticle,
        review => review.product
    )
    public readonly review!: safe.Has.OneToOne<BbsReviewArticle>;
}