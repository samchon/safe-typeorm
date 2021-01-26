import * as orm from "typeorm";

import { Has } from "../../Has";
import { IncrementalColumn } from "../../IncrementalColumn";
import { Model } from "../../Model";

import { Enumeration } from "./Enumeration";

@orm.Entity()
export class EnumerationGroup extends Model
{
    @IncrementalColumn()
    public readonly id!: number;

    @Has.OneToMany(() => Enumeration, "group")
    public children!: Has.OneToMany<Enumeration>;
}