import safe from "safe-typeorm";
import * as orm from "typeorm";

@orm.Entity()
export class AttachmentFile extends safe.Model {
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

    @orm.Column("varchar")
    public readonly name!: string;

    @orm.Column("varchar", { nullable: true })
    public readonly extension!: string | null;

    @orm.Column("varchar", { length: 1000 })
    public readonly url!: string;
}
