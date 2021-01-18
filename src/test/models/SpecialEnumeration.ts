import * as orm from "typeorm";

import { Belongs } from "../../Belongs";

import { Enumeration } from "./Enumeration";

@orm.Entity()
export class SpecialEnumeration extends orm.BaseEntity
{
    @Belongs.OneToOne(() => Enumeration, "id", { primary: true })
    public base!: Belongs.OneToOne<Enumeration>;

    public readonly id!: number;
}