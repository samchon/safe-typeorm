import * as orm from "typeorm";
import { HashMap } from "tstl/container/HashMap";
import { InvalidArgument } from "tstl/exception/InvalidArgument";

import { Creator } from "../typings/Creator";
import { ITableInfo } from "../functional/internal/ITableInfo";

import { insert } from "../functional/insert";
import { DomainError, Mutex, Pair, UniqueLock, Vector } from "tstl";

export class InsertCollection
{
    private readonly dict_: HashMap<Creator<object>, object[]>;
    private readonly befores_: Vector<InsertPocket.Process>;
    private readonly afters_: Vector<InsertPocket.Process>;

    private readonly prerequisites_: Pair<Creator<object>, Creator<object>>[];
    private readonly mutex_: Mutex;

    public constructor()
    {
        this.dict_ = new HashMap();
        this.befores_ = new Vector();
        this.afters_ = new Vector();

        this.prerequisites_ = [];
        this.mutex_ = new Mutex();
    }

    public prerequisite<T extends object, Precede extends object>
        (target: Creator<T>, precede: Creator<Precede>): void
    {
        this.prerequisites_.push(new Pair(target, precede));
    }

    /* -----------------------------------------------------------
        ELEMENTS I/O
    ----------------------------------------------------------- */
    public push<T extends object>(record: T): T;
    public push<T extends object>(records: T[]): T[];

    public push<T extends object>(input: T | T[]): T | T[]
    {
        if (input instanceof Array)
            return this._Push(input);
        else
            return this._Push([input])[0];
    }

    public before(process: InsertPocket.Process): void
    {
        this.befores_.push_back(process);
    }

    public after(process: InsertPocket.Process): void
    {
        this.afters_.push_back(process);
    }

    private _Push<T extends object>(records: T[]): T[]
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

    /* -----------------------------------------------------------
        EXECUTE QUERY
    ----------------------------------------------------------- */
    public async execute(manager?: orm.EntityManager): Promise<void>
    {
        if (manager)
            await this._Execute(manager);
        else
            await orm.getConnection().transaction
            (
                manager => this._Execute(manager)
            );
    }

    private async _Execute(manager: orm.EntityManager): Promise<void>
    {
        const success: boolean = await UniqueLock.try_lock(this.mutex_, async () =>
        {
            for (const process of this.befores_)
                await process(manager);
            for (const row of this._Get_records())
                await insert(manager, row);
            for (const process of this.afters_)
                await process(manager);

            this.dict_.clear();
            this.befores_.clear();
            this.afters_.clear();
        });
        if (success === false)
            throw new DomainError("Error on InsertCollection.execute(): it's already on executing.");
    }

    private _Get_records(): object[][]
    {
        const output: Vector<object[]> = new Vector();
        for (const it of this.dict_)
            output.push_back(it.second);

        for (const tuple of this.prerequisites_)
        {
            const indexes: Pair<number, number> = new Pair
            (
                output.data().findIndex(row => row[0].constructor === tuple.first),
                output.data().findIndex(row => row[0].constructor === tuple.second)
            );
            if (indexes.first !== -1 
                && indexes.second !== -1 
                && indexes.first < indexes.second)
            {
                const row: object[] = output.at(indexes.second);
                output.erase(output.nth(indexes.second));
                output.insert(output.nth(indexes.first), row);
            }
        }
        return output.data();
    }
}

export namespace InsertPocket
{
    export type Process = (manager: orm.EntityManager) => Promise<any>;
}