import * as orm from "typeorm";

import { Belongs } from "../../Belongs";
import { Model } from "../../Model";

import { Enumeration } from "./Enumeration";

@orm.Entity()
export class SpecialEnumeration extends Model
{
    @Belongs.OneToOne(() => Enumeration, 
        "special", 
        "id", 
        { primary: true }
    )
    public base!: Belongs.OneToOne<Enumeration>;

    public readonly id!: number;
}