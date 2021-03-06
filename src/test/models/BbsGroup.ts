import * as orm from "typeorm";
import { v4 } from "uuid";

import { Model } from "../../Model";

import { BbsArticle } from "./BbsArticle";
import { Belongs } from "../../decorators/Belongs";
import { Has } from "../../decorators/Has";

@orm.Entity()
export class BbsGroup extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public id: string = v4();

    @Belongs.ManyToOne(() => BbsGroup, 
        parent => parent.children,
        "uuid",
        "pid",
        { index: true, nullable: true }
    )
    public parent!: Belongs.ManyToOne<BbsGroup, "uuid", { nullable: true }>;

    @orm.Index({ unique: true })
    @orm.Column("varchar")
    public code!: string;

    @orm.Column("varchar")
    public name!: string;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @Has.OneToMany(() => BbsGroup, child => child.parent)
    public children!: Has.OneToMany<BbsGroup>;

    @Has.OneToMany(() => BbsArticle, article => article.group)
    public articles!: Has.OneToMany<BbsArticle>;
}