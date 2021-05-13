import * as orm from "typeorm";
import { HashMap } from "tstl/container/HashMap";
import { InvalidArgument } from "tstl/exception/InvalidArgument";

import { Creator } from "../typings/Creator";
import { ITableInfo } from "../functional/internal/ITableInfo";

import { insert } from "../functional/insert";

export class InsertCollection
{
    private readonly dict_: HashMap<Creator<object>, object[]>;
    private readonly befores_: Array<InsertPocket.Process>;
    private readonly afters_: Array<InsertPocket.Process>;

    public constructor()
    {
        this.dict_ = new HashMap();
        this.befores_ = [];
        this.afters_ = [];
    }

    public push<T extends object>(...records: T[]): T[]
    {
        if (records.length === 0)
            return records;

        const creator: Creator<T> = records[0].constructor as Creator<T>;
        let it: HashMap.Iterator<Creator<object>, object[]> = this.dict_.find(creator);

        if (it.equals(this.dict_.end()) === true)
        {
            const info: ITableInfo = ITableInfo.get(creator);
            if (info.incremental === true)
                throw new InvalidArgument("Error on safe.InsertPocket.push(): primary key of the target table is incremental.");

            it = this.dict_.emplace(creator, []).first;
        }
        it.second.push(...records);
        return records;
    }

    public push_back<T extends object>(record: T): T
    {
        return this.push(record)[0];
    }

    public before(process: InsertPocket.Process): void
    {
        this.befores_.push(process);
    }

    public after(process: InsertPocket.Process): void
    {
        this.afters_.push(process);
    }

    public async execute(manager: orm.EntityManager = orm.getManager()): Promise<void>
    {
        for (const process of this.befores_)
            await process(manager);
        for (const tuple of this.dict_)
        {
            const records: object[] = tuple.second;
            await insert(manager, records);
        }
        for (const process of this.afters_)
            await process(manager);
    }
}

export namespace InsertPocket
{
    export type Process = (manager: orm.EntityManager) => Promise<void>;
}