import * as orm from "typeorm";
import { DomainError } from "tstl/exception/DomainError";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { Mutex } from "tstl/thread/Mutex";
import { UniqueLock } from "tstl/thread/UniqueLock";
import { Vector } from "tstl/container/Vector";
import { sort } from "tstl/ranges/algorithm/sorting";

import { Creator } from "../typings/Creator";
import { ITableInfo } from "../functional/internal/ITableInfo";
import { insert } from "../functional/insert";

export class InsertCollection
{
    private dict_: Map<Creator<object>, object[]>;

    private readonly befores_: Vector<InsertPocket.Process>;
    private readonly afters_: Vector<InsertPocket.Process>;

    private readonly mutex_: Mutex;

    public constructor()
    {
        this.dict_ = new Map();

        this.befores_ = new Vector();
        this.afters_ = new Vector();

        this.mutex_ = new Mutex();
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
        let container: object[] | undefined = this.dict_.get(creator);

        if (container === undefined)
        {
            const info: ITableInfo = ITableInfo.get(creator);
            if (info.incremental === true)
                throw new InvalidArgument("Error on safe.InsertPocket.push(): primary key of the target table is incremental.");

            container = [];
            this.dict_.set(creator, container);
        }
        container.push(...records);
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
            for (const row of this._Get_records(orm.getConnection()))
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

    private _Get_records(connection: orm.Connection): object[][]
    {
        function compare(x: object[], y: object[]): boolean
        {
            const children: Set<Creator<object>> = getDependencies(connection, y[0].constructor as Creator<object>);
            return !children.has(x[0].constructor as Creator<object>);
        }

        const output: Vector<object[]> = new Vector();
        for (const [_, record] of this.dict_)
            output.push_back(record);
        
        sort(output, compare);
        return output.data();
    }
}

export namespace InsertPocket
{
    export type Process = (manager: orm.EntityManager) => Promise<any>;
}

function getDependencies<T extends object>
    (connection: orm.Connection, target: Creator<T>): Set<Creator<object>>
{
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
                    for (const grand of getDependencies(connection, child))
                        output.add(grand);
                    break;
                }
        }
        dependencies.set(target, output);
    }
    return output;
}

const dependencies: WeakMap<Creator<object>, Set<Creator<object>>> = new WeakMap();