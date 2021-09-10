import { Belongs } from "../decorators/Belongs";
import { Has } from "../decorators/Has";

import { Creator } from "../typings/Creator";
import { OmitNever } from "../typings/OmitNever";
import { PrimaryGeneratedColumn } from "../typings/PrimaryGeneratedColumn";
import { Relationship } from "../typings/Relationship";

import { AppJoinBuilder } from "./AppJoinBuilder";
import { ArrayUtil } from "../test/internal/ArrayUtil";
import { DEFAULT } from "../DEFAULT";
import { Primitive } from "../typings/Primitive";
import { toPrimitive } from "../functional/toPrimitive";

export class JsonSelectBuilder<
        Mine extends object, 
        InputT extends JsonSelectBuilder.Input<Mine>,
        Destination = JsonSelectBuilder.Output<Mine, InputT>>
{
    private readonly mine_: Creator<Mine>;
    private readonly input_: InputT;
    private readonly closure_?: Function;

    private readonly joiner_: AppJoinBuilder<Mine>;

    public constructor(mine: Creator<Mine>, input: InputT);
    public constructor
        (
            mine: Creator<Mine>, 
            input: InputT, 
            mapper: JsonSelectBuilder.OutputMapper<Mine, InputT, Destination>
        );

    public constructor
        (
            mine: Creator<Mine>, 
            input: InputT, 
            mapper?: JsonSelectBuilder.OutputMapper<Mine, InputT, Destination>
        )
    {
        this.mine_ = mine;
        this.input_ = input;
        this.closure_ = mapper;

        this.joiner_ = new AppJoinBuilder(this.mine_);
        for (const [key, value] of Object.entries(input))
            if (value instanceof JsonSelectBuilder)
                this.joiner_.set(key as any, value.joiner_);
    }

    public async getOne(record: Mine, skipAppJoin: boolean = false): Promise<Destination>
    {
        const data: Destination[] = await this.getMany([ record ], skipAppJoin);
        return data[0];
    }

    public async getMany(records: Mine[], skipAppJoin: boolean = false): Promise<Destination[]>
    {
        if (skipAppJoin === false)
            await this.joiner_.execute(records);
        
        const output: JsonSelectBuilder.Output<Mine, InputT>[] = await ArrayUtil.asyncMap
        (
            records,
            rec => this._Convert(rec)
        );
        return this.closure_ 
            ? output.map(this.closure_ as any) as any
            : output as any;
    }

    private async _Convert(record: Mine): Promise<JsonSelectBuilder.Output<Mine, InputT>>
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
            else
            {
                let data = (record as any)[key];
                if (data instanceof Belongs.ManyToOne.Accessor)
                    data = data.id;
                
                if (plan === DEFAULT)
                    output[key] = data;
                else if (plan instanceof Function)
                    output[key] = plan(data);
            }
        }
        return output;
    }
}

export namespace JsonSelectBuilder
{
    export type Input<Mine extends object> = OmitNever<
    {
        [P in keyof Mine]: Mine[P] extends Relationship<infer Target>
            ? Mine[P] extends Belongs.ManyToOne<Target, any, infer TargetOptions>
                ? TargetOptions extends { nullable: true }
                    ? JsonSelectBuilder<Target, any, any> | DEFAULT | undefined
                    : JsonSelectBuilder<Target, any, any> | DEFAULT | undefined
            : JsonSelectBuilder<Target, any, any> | undefined
            : never
    }>;

    export type Output<Mine extends object, InputT extends object> = Primitive<Mine> & OmitNever<
    {
        [P in keyof (Mine|InputT)]
            : InputT[P] extends JsonSelectBuilder<infer Target, any, infer Destination>
                ? Mine[P] extends Belongs.ManyToOne<Target, any, infer Options>
                    ? Options extends { nullable: true }
                        ? Destination | null
                        : Destination
                : Mine[P] extends Has.OneToOne<Target, infer Ensure>
                    ? Ensure extends true
                        ? Destination
                        : Destination | null
                : Destination[]
            : InputT[P] extends DEFAULT 
                ? Mine[P] extends Belongs.ManyToOne<any, infer PrimaryKey, infer Options>
                    ? Options extends { nullable: true }
                        ? PrimaryGeneratedColumn.ValueType<PrimaryKey> | null
                        : PrimaryGeneratedColumn.ValueType<PrimaryKey>
                    : never
            : never;
    }>;
    
    export type OutputMapper<Mine extends object, InputT extends Input<Mine>, Destination> 
        = (output: Output<Mine, InputT>, index: number, array: Output<Mine, InputT>[]) => Destination;
}