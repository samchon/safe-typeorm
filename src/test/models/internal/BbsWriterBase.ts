import * as orm from "typeorm";
import safe from "../../.."

export abstract class BbsWriterBase extends safe.Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn("uuid")
    public readonly id!: string;

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
}
