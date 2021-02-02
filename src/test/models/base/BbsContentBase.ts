import * as orm from "typeorm";

import { EncryptedColumn } from "../../../decorators/EncryptedColumn";
import { Model } from "../../../Model";
import { Password } from "../../../utils/Password";

export abstract class BbsContentBase extends Model
{
    /* -----------------------------------------------------------
        COLUMNS
    ----------------------------------------------------------- */
    @orm.PrimaryGeneratedColumn()
    public readonly id!: number;

    @EncryptedColumn("varchar", {
        index: true,
        password: {
            key: "2YARktSMoHFvsdZeHRqz88wed5l758Kh",
            iv: "HUPIoSp7NqQ9UHnN"
        }
    })
    public writer!: string;

    @orm.Column(() => Password, { prefix: "" })
    public password: Password = new Password();

    @orm.Column("text")
    public content!: string;

    @orm.Index()
    @orm.CreateDateColumn()
    public created_at!: Date;

    @orm.UpdateDateColumn()
    public updated_at!: Date;

    @orm.DeleteDateColumn({ nullable: true })
    public deleted_at!: Date | null;
}