import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";

import { Creator } from "../typings/Creator";
import { OmitNever } from "../typings/OmitNever";
import { PrimaryGeneratedColumn } from "../typings/PrimaryGeneratedColumn";
import { Relationship } from "../typings/Relationship";
import { Same } from "../typings/Same";

import { AppJoinBuilder } from "./AppJoinBuilder";
import { ArrayUtil } from "../utils/ArrayUtil";
import { BelongsAccessorBase } from "../decorators/base/BelongsAccessorBase";
import { DEFAULT } from "../DEFAULT";
import { Primitive } from "../typings/Primitive";
import { toPrimitive } from "../functional/toPrimitive";

/**
 * JSON Select Builder.
 * 
 * @template Mine Target entity to convert to JSON data
 * @template InputT Type of input listing up the joining plans
 * @template Destination Output JSON type. Default is {@link JsonSelectBuilder.Output}
 * @author Jeongho Nam - https://github.com/samchon
 */
export class JsonSelectBuilder<
        Mine extends object, 
        InputT extends JsonSelectBuilder.Input<Mine>,
        Destination = JsonSelectBuilder.Output<Mine, InputT>>
{
    private readonly mine_: Creator<Mine>;
    private readonly input_: InputT;
    private readonly mapper_?: Function;

    private readonly joiner_: AppJoinBuilder<Mine>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Default Constructor.
     * 
     * @param mine Target ORM class to perform the DB join
     * @param input List of relationship decorated fields with joining plan
     * @param mapper Map function to convert output type
     */
    public constructor
        (
            mine: Creator<Mine>, 
            input: InputT, 
            mapper?: JsonSelectBuilder.Output.Mapper<Mine, InputT, Destination>
        )
    {
        this.mine_ = mine;
        this.input_ = input;
        this.mapper_ = mapper;

        this.joiner_ = new AppJoinBuilder(this.mine_);
        for (const [key, value] of Object.entries(input))
            if (value instanceof JsonSelectBuilder)
                this.joiner_.set(key as any, value.joiner_);
    }

    /**
     * Execute app join.
     * 
     * @param data Target record(s) to be joined
     */
    public async join(data: Mine | Mine[]): Promise<void>
    {
        await this.joiner_.execute(data as Mine[]);
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    /**
     * 
     * @param record 
     * @param skipAppJoin 
     * @returns 
     */
    public async getOne(record: Mine, skipAppJoin: boolean = false): Promise<Destination>
    {
        const data: Destination[] = await this.getMany([ record ], skipAppJoin);
        return data[0];
    }

    /**
     * 
     * @param records 
     * @param skipAppJoin 
     * @returns 
     */
    public async getMany(records: Mine[], skipAppJoin: boolean = false): Promise<Destination[]>
    {
        if (skipAppJoin === false)
            await this.joiner_.execute(records);
        
        const output: Destination[] = await ArrayUtil.asyncMap
        (
            records,
            rec => this._Convert(rec)
        );
        return output;
    }

    /* -----------------------------------------------------------
        CONVERTERS
    ----------------------------------------------------------- */
    private async _Convert(record: Mine): Promise<Destination>
    {
        const output: any = toPrimitive(record);
        for (const [key, plan] of Object.entries(this.input_))
        {
            if (plan === undefined)
                continue;
            else if (plan instanceof JsonSelectBuilder)
            {
                const data = await (record as any)[key].get();
                if (data === null)
                    output[key] = null;
                else if (data instanceof Array)
                    output[key] = await ArrayUtil.asyncMap(data, item => plan._Convert(item));
                else
                    output[key] = await plan._Convert(data);
            }
            else if (plan === "recursive")
                output[key] = await this._Convert_Recursive(key, record);
            else
            {
                let data = (record as any)[key];
                if (data instanceof BelongsAccessorBase)
                    data = data.id;
                
                if (plan === DEFAULT)
                    output[key] = data;
                else if (plan instanceof Function)
                    output[key] = plan(data);
            }
        }
        return this.mapper_
            ? this.mapper_(output, record)
            : output;
    }

    private async _Convert_Recursive(key: string, record: Mine): Promise<any>
    {
        const data = await (record as any)[key].get();
        let output: any;

        if (data === null)
            output = null;
        else if (data instanceof Array)
        {
            output = data.map(elem => toPrimitive(elem));
            for (let i: number = 0; i < data.length; ++i)
                output[i][key] = await this._Convert_Recursive(key, data[i]);
        }
        else
        {
            output = toPrimitive(data);
            output[key] = await this._Convert_Recursive(key, data);
        }
        return output;
    }
}

export namespace JsonSelectBuilder
{
    /**
     * 
     */
    export type Input<Mine extends object> = OmitNever<
    {
        [P in keyof Mine]: Mine[P] extends Relationship<infer Target>
            ? Mine[P] extends BelongsCommon<Target, any, infer TargetOptions>
                ? TargetOptions extends { nullable: true }
                    ? Same<Mine, Target> extends true
                        ? "recursive" | DEFAULT | undefined
                        : JsonSelectBuilder<Target, any, any> | DEFAULT | undefined
                    : Same<Mine, Target> extends true 
                        ? "recursive" | DEFAULT | undefined
                        : JsonSelectBuilder<Target, any, any> | DEFAULT | undefined
            : Same<Mine, Target> extends true 
                ? "recursive" | undefined
                : JsonSelectBuilder<Target, any, any> | undefined
            : never
    }>;

    /**
     * 
     */
    export type Output<Mine extends object, InputT extends object> = Primitive<Mine> & OmitNever<
    {
        [P in keyof (Mine|InputT)]
            : InputT[P] extends JsonSelectBuilder<infer Target, any, infer Destination>
                ? Mine[P] extends BelongsCommon<Target, any, infer Options>
                    ? Options extends { nullable: true }
                        ? Destination | null
                        : Destination
                : Mine[P] extends HasOneToOneCommon<Target, infer Ensure>
                    ? Ensure extends true
                        ? Destination
                        : Destination | null
                : Destination[]
            : InputT[P] extends "recursive"
                ? Mine[P] extends BelongsCommon<Mine, any, infer Options>
                    ? Options extends { nullable: true }
                        ? Output.RecursiveReference<Mine, P> | null
                        : never // never be happened
                : Mine[P] extends HasOneToOneCommon<Mine, infer Ensure>
                    ? Ensure extends true
                        ? never // never be happened
                        : Output.RecursiveReference<Mine, P> | null
                : Mine[P] extends (Has.OneToMany<Mine> | Has.External.OneToMany<Mine>) 
                    ? Output.RecursiveArray<Mine, P>
                : Mine[P] extends Has.ManyToMany<Mine, any> 
                    ? Output.RecursiveArray<Mine, P>
                : never
            : InputT[P] extends DEFAULT 
                ? Mine[P] extends BelongsCommon<any, infer PrimaryKey, infer Options>
                    ? Options extends { nullable: true }
                        ? PrimaryGeneratedColumn.ValueType<PrimaryKey> | null
                        : PrimaryGeneratedColumn.ValueType<PrimaryKey>
                    : never
            : never;
    }>;
    export namespace Output
    {
        /**
         * 
         */
        export type RecursiveReference<
                Mine extends object,
                Key extends keyof Mine>
            = Primitive<Mine> &
        {
            [P in Key]: RecursiveReference<Mine, Key> | null;
        };

        /**
         * 
         */
        export type RecursiveArray<
                Mine extends object, 
                Key extends keyof Mine>
            = Primitive<Mine> &
        {
            [P in Key]: RecursiveArray<Mine, Key>[];
        };

        /**
         * 
         */
        export interface Mapper<Mine extends object, InputT extends Input<Mine>, Destination> 
        {
            (
                output: Output<Mine, InputT>,
                model: Mine,
            ): Destination;
        }
    }

    type BelongsCommon<
            Target extends object, 
            PrimaryKey extends PrimaryGeneratedColumn, 
            Options extends { nullable: boolean }>
        = Belongs.ManyToOne<Target, PrimaryKey, Options>
        | Belongs.OneToOne<Target, PrimaryKey, Options>
        | Belongs.External.OneToOne<Target, PrimaryKey, Options>
        | Belongs.External.ManyToOne<Target, PrimaryKey, Options>;

    type HasOneToOneCommon<Target extends object, Ensure extends boolean>
         = Has.OneToOne<Target, Ensure>
         | Has.External.OneToOne<Target, Ensure>;
}