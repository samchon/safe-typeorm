import safe from "safe-typeorm";
import * as orm from "typeorm";

import { BlogUserScrap } from "./BlogUserScrap";

@orm.Entity()
export class BlogUser extends safe.Model {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @orm.Index({ unique: true })
    @orm.Column("varchar")
    public readonly email!: string;

    @orm.Column(() => safe.Password, { prefix: "" })
    public readonly password: safe.Password = new safe.Password();

    @orm.CreateDateColumn()
    public readonly created_at!: Date;

    /* -----------------------------------------------------------
        HAS
    ----------------------------------------------------------- */
    @safe.Has.OneToMany(
        () => BlogUserScrap,
        (scrap) => scrap.user,
        (x, y) => x.created_at.getTime() - y.created_at.getTime(),
    )
    public readonly scraps!: safe.Has.OneToMany<BlogUserScrap>;
}
