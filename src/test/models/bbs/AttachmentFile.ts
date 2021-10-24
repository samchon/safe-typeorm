import * as orm from "typeorm";
import safe from "../../..";

@orm.Entity()
export class AttachmentFile extends safe.Model
{
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