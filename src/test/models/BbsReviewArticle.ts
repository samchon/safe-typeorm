import * as orm from "typeorm";
import safe from "../..";

import { BbsArticle } from "./BbsArticle";
import { BbsProduct } from "./BbsProduct";

@orm.Entity()
export class BbsReviewArticle extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @safe.Belongs.OneToOne(() => BbsArticle,
        article => article.review,
        "uuid",
        "id",
        { primary: true }
    )
    public readonly base!: safe.Belongs.OneToOne<BbsArticle, "uuid">;

    @safe.Belongs.OneToOne(() => BbsProduct,
        product => product.review,
        "uuid",
        "bbs_product_id",
        { unique: true, nullable: true }
    )
    public readonly product!: safe.Belongs.OneToOne<BbsProduct, "uuid", { nullable: true }>;
}