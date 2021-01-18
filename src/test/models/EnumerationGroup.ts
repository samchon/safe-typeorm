import * as orm from "typeorm";

import { Has } from "../../Has";
import { IncrementalColumn } from "../../IncrementalColumn";

import { Enumeration } from "./Enumeration";

@orm.Entity()
export class EnumerationGroup extends orm.BaseEntity
{
    @IncrementalColumn()
    public readonly id!: number;

    @Has.OneToMany(() => Enumeration, "group")
    public children!: Has.OneToMany<Enumeration>;
}