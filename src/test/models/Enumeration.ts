import * as orm from "typeorm";

import { Belongs } from "../../Belongs";
import { Has } from "../../Has";
import { IncrementalColumn } from "../../IncrementalColumn";
import { Model } from "../../Model";

import { EnumerationGroup } from "./EnumerationGroup";
import { SpecialEnumeration } from "./SpecialEnumeration";

@orm.Entity()
export class Enumeration extends Model
{
    @IncrementalColumn()
    public readonly id!: number;
    
    @Belongs.ManyToOne(() => EnumerationGroup, 
        "children", 
        "enumration_group_id"
    )
    public group!: Belongs.ManyToOne<EnumerationGroup>;

    @Has.OneToOne(() => SpecialEnumeration, "base")
    public special!: Has.OneToOne<SpecialEnumeration>;
}