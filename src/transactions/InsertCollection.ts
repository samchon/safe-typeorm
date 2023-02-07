import { Vector } from "tstl/container/Vector";
import { DomainError } from "tstl/exception/DomainError";
import { InvalidArgument } from "tstl/exception/InvalidArgument";
import { sort } from "tstl/ranges/algorithm/sorting";
import { Mutex } from "tstl/thread/Mutex";
import { UniqueLock } from "tstl/thread/UniqueLock";
import { Pair } from "tstl/utility/Pair";
import * as orm from "typeorm";

import { findRepository } from "../functional/findRepository";
import { insert } from "../functional/insert";
import { ITableInfo } from "../functional/internal/ITableInfo";

import { Creator } from "../typings/Creator";

import { MapUtil } from "../utils/MapUtil";

export class InsertCollection {
    private dict_: Map<Creator<object>, Pair<object[], string | boolean>>;

    private readonly befores_: Vector<InsertCollection.Process>;
    private readonly afters_: Vector<InsertCollection.Process>;
    private readonly mutex_: Mutex;

    public constructor(public limit: number = InsertCollection.DEFAULT_LIMIT) {
        this.dict_ = new Map();

        this.befores_ = new Vector();
        this.afters_ = new Vector();
        this.mutex_ = new Mutex();
    }

    /* -----------------------------------------------------------
        ELEMENTS I/O
    ----------------------------------------------------------- */
    public push<T extends object>(record: T, ignore?: string | boolean): T;
    public push<T extends object>(records: T[], ignore?: string | boolean): T[];
    public push<T extends object>(
        input: T | T[],
        ignore: string | boolean = false,
    ): T | T[] {
        if (input instanceof Array) return this._Push(input, ignore);
        else return this._Push([input], ignore)[0];
    }

    public before(process: InsertCollection.Process): void {
        this.befores_.push_back(process);
    }

    public after(process: InsertCollection.Process): void {
        this.afters_.push_back(process);
    }

    private _Push<T extends object>(
        records: T[],
        ignore: string | boolean,
    ): T[] {
        if (records.length === 0) return records;

        const creator: Creator<T> = records[0].constructor as Creator<T>;
        const tuple: Pair<object[], string | boolean> = MapUtil.take(
            this.dict_,
            creator,
            () => {
                const info: ITableInfo = ITableInfo.get(creator);
                if (info.incremental === true)
                    throw new InvalidArgument(
                        "Error on safe.InsertPocket.push(): primary key of the target table is incremental.",
                    );
                return new Pair([], ignore);
            },
            (oldbie) => {
                if (oldbie.second === false && ignore === true)
                    oldbie.second = true;
            },
        );

        for (const elem of records) tuple.first.push(elem);
        return records;
    }

    /* -----------------------------------------------------------
        EXECUTE QUERY
    ----------------------------------------------------------- */
    public async execute(manager?: orm.EntityManager): Promise<void> {
        await this._Execute(manager);
    }

    private async _Execute(
        manager: orm.EntityManager | undefined,
    ): Promise<void> {
        const success: boolean = await UniqueLock.try_lock(
            this.mutex_,
            async () => {
                for (const process of this.befores_) await process(manager!);
                for (const tuple of this._Get_record_tuples())
                    while (tuple.first.length !== 0) {
                        const pieces: object[] = tuple.first.splice(
                            0,
                            this.limit,
                        );
                        if (manager !== undefined)
                            await insert(manager, pieces, tuple.second);
                        else await insert(pieces, tuple.second);
                    }
                for (const process of this.afters_) await process(manager!);

                this.dict_.clear();
                this.befores_.clear();
                this.afters_.clear();
            },
        );
        if (success === false)
            throw new DomainError(
                "Error on InsertCollection.execute(): it's already on executing.",
            );
    }

    private _Get_record_tuples(): Pair<object[], string | boolean>[] {
        function compare(
            x: Pair<object[], string | boolean>,
            y: Pair<object[], string | boolean>,
        ): boolean {
            const children: Set<Creator<object>> = getDependencies(
                y.first[0].constructor as Creator<object>,
            );
            return !children.has(x.first[0].constructor as Creator<object>);
        }

        const output: Vector<Pair<object[], string | boolean>> = new Vector();
        for (const [_, tuple] of this.dict_) output.push_back(tuple);

        sort(output, compare);
        return output.data();
    }
}

export namespace InsertCollection {
    export interface Process {
        (): Promise<any>;
        (manager: orm.EntityManager): Promise<any>;
    }

    /* eslint-disable */
    /**
     * Default piece count for the extended insert query.
     */
    export let DEFAULT_LIMIT: number = 1000;
}

function getDependencies<T extends object>(
    target: Creator<T>,
    connection?: orm.Connection,
): Set<Creator<object>> {
    // CONNECTION
    if (!connection) connection = findRepository(target).manager.connection;

    // FIND OLDBIE ITEM
    const oldbie: Set<Creator<object>> | undefined = dependencies.get(target);
    if (oldbie) return oldbie;

    // CREATE NEW ONE
    const output: Set<Creator<object>> = new Set();
    dependencies.set(target, output);

    for (const meta of connection!.entityMetadatas) {
        const child: Creator<object> = meta.target as Creator<object>;
        if (child === target) continue;

        for (const foreign of meta.foreignKeys)
            if (foreign.referencedEntityMetadata.target === target) {
                output.add(child);
                for (const grand of getDependencies(child, connection))
                    output.add(grand);
                break;
            }
    }
    return output;
}

const dependencies: WeakMap<Creator<object>, Set<Creator<object>>> = new Map();
