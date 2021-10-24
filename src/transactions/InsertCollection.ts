import * as orm from "typeorm";
import { DomainError } from "tstl/exception/DomainError";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { Mutex } from "tstl/thread/Mutex";
import { UniqueLock } from "tstl/thread/UniqueLock";
import { Pair } from "tstl/utility/Pair";
import { Vector } from "tstl/container/Vector";
import { sort } from "tstl/ranges/algorithm/sorting";

import { Creator } from "../typings/Creator";
import { ITableInfo } from "../functional/internal/ITableInfo";
import { findRepository } from "../functional/findRepository";
import { insert } from "../functional/insert";

export class InsertCollection
{
    private dict_: Map<Creator<object>, Pair<object[], boolean>>;

    private readonly befores_: Vector<InsertPocket.Process>;
    private readonly afters_: Vector<InsertPocket.Process>;
    private readonly mutex_: Mutex;
    private readonly limit_: number;

    public constructor(limit: number = 1000)
    {
        this.dict_ = new Map();

        this.befores_ = new Vector();
        this.afters_ = new Vector();
        this.mutex_ = new Mutex();
        this.limit_ = limit;
    }

    /* -----------------------------------------------------------
        ELEMENTS I/O
    ----------------------------------------------------------- */
    public push<T extends object>(record: T, ignore?: boolean): T;
    public push<T extends object>(records: T[], ignore?: boolean): T[];

    public push<T extends object>(input: T | T[], ignore: boolean = false): T | T[]
    {
        if (input instanceof Array)
            return this._Push(input, ignore);
        else
            return this._Push([input], ignore)[0];
    }

    public before(process: InsertPocket.Process): void
    {
        this.befores_.push_back(process);
    }

    public after(process: InsertPocket.Process): void
    {
        this.afters_.push_back(process);
    }

    private _Push<T extends object>(records: T[], ignore: boolean): T[]
    {
        if (records.length === 0)
            return records;

        const creator: Creator<T> = records[0].constructor as Creator<T>;
        let tuple: Pair<object[], boolean> | undefined = this.dict_.get(creator);

        if (tuple === undefined)
        {
            const info: ITableInfo = ITableInfo.get(creator);
            if (info.incremental === true)
                throw new InvalidArgument("Error on safe.InsertPocket.push(): primary key of the target table is incremental.");

            tuple = new Pair([], ignore);
            this.dict_.set(creator, tuple);
        }
        else if (tuple.second === false && ignore === true)
            tuple.second = true

        for (const elem of records)
            tuple.first.push(elem);
        return records;
    }

    /* -----------------------------------------------------------
        EXECUTE QUERY
    ----------------------------------------------------------- */
    public async execute(manager?: orm.EntityManager): Promise<void>
    {
        await this._Execute(manager);
    }

    private async _Execute(manager: orm.EntityManager | undefined): Promise<void>
    {
        const success: boolean = await UniqueLock.try_lock(this.mutex_, async () =>
        {
            for (const process of this.befores_)
                await process(manager!);
            for (const tuple of this._Get_record_tuples())
                while (tuple.first.length !== 0)
                {
                    const pieces: object[] = tuple.first.splice(0, this.limit_);
                    if (manager !== undefined)
                        await insert(manager, pieces, tuple.second);
                    else
                        await insert(pieces, tuple.second);
                }
            for (const process of this.afters_)
                await process(manager!);

            this.dict_.clear();
            this.befores_.clear();
            this.afters_.clear();
        });
        if (success === false)
            throw new DomainError("Error on InsertCollection.execute(): it's already on executing.");
    }

    private _Get_record_tuples(): Pair<object[], boolean>[]
    {
        function compare(x: Pair<object[], boolean>, y: Pair<object[], boolean>): boolean
        {
            const children: Set<Creator<object>> = getDependencies(y.first[0].constructor as Creator<object>);
            return !children.has(x.first[0].constructor as Creator<object>);
        }

        const output: Vector<Pair<object[], boolean>> = new Vector();
        for (const [_, tuple] of this.dict_)
            output.push_back(tuple);
        
        sort(output, compare);
        return output.data();
    }
}

export namespace InsertPocket
{
    export interface Process
    {
        (): Promise<any>;
        (manager: orm.EntityManager): Promise<any>;
    }
}

function getDependencies<T extends object>
    (target: Creator<T>, connection?: orm.Connection): Set<Creator<object>>
{
    if (!connection) 
        connection = findRepository(target).manager.connection;

    let output: Set<Creator<object>> | undefined = dependencies.get(target);
    if (output === undefined)
    {
        output = new Set();
        for (const meta of connection.entityMetadatas)
        {
            const child: Creator<object> = meta.target as Creator<object>;
            if (child === target)
                continue;

            for (const foreign of meta.foreignKeys)
                if (foreign.referencedEntityMetadata.target === target)
                {
                    output.add(child);
                    for (const grand of getDependencies(child, connection))
                        output.add(grand);
                    break;
                }
        }
        dependencies.set(target, output);
    }
    return output;
}

const dependencies: WeakMap<Creator<object>, Set<Creator<object>>> = new WeakMap();