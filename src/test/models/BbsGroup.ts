import * as orm from "typeorm";
import { Model } from "../../Model";

import { IncrementalColumn } from "../../decorators/IncrementalColumn";

import { BbsArticle } from "./BbsArticle";
import { Belongs } from "../../decorators/Belongs";
import { Has } from "../../decorators/Has";

@orm.Entity()
export class BbsGroup extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @IncrementalColumn()
    public readonly id!: number;

    @Belongs.ManyToOne(() => BbsGroup, 
        "children",
        "pid",
        { index: true, nullable: true }
    )
    public parent!: Belongs.ManyToOne<BbsGroup, { nullable: true }>;

    @orm.Index({ unique: true })
    @orm.Column("varchar")
    public code!: string;

    @orm.Column("varchar")
    public name!: string;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @Has.OneToMany(() => BbsGroup, "parent")
    public children!: Has.OneToMany<BbsGroup>;

    @Has.OneToMany(() => BbsArticle, "group")
    public articles!: Has.OneToMany<BbsArticle>;
}