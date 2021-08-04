import { v4 } from "uuid";

import { DEFAULT } from "../DEFAULT";
import { ITableInfo } from "./internal/ITableInfo";

import { Belongs } from "../decorators/Belongs";
import { Creator } from "../typings/Creator";
import { Initialized } from "../typings/Initialized";

/**
 * Initialize a model instance.
 * 
 * `initailize()` is a global function creating a new model instance very safely.
 * 
 * Unlike `TypeORM.Repository.create()` method, who can cause the critical runtime error by
 * ommitting essential variables, the `initialize()` function does nott permit ommitting the 
 * essential member variables in the compilation level.
 * 
 * In such reason, if you don't ignore error message from the TypeScript compiler, there can't be 
 * any runtime error that is caused by the ommitting essential column values in the SQL INSERT or 
 * UPDATE level.
 * 
 * @template T Type of a model class that is derived from the `Model`
 * @param input Variables that would be assigned to the new model instance
 * @return A new model instance
 */
export function initialize<T extends object>
    (creator: Creator<T>, input: Initialized<T>): T
{
    const info: ITableInfo = ITableInfo.get(creator);
    const output: any = new creator();

    for (const [key, value] of Object.entries(input))
    {
        if (value === DEFAULT)
            continue;

        const type = typeof value;
        if (output[key] instanceof Belongs.HELPER_TYPE)
        {
            if (value instanceof Object)
                output[key].set(value);
            else
                output[key].id = value;
        }
        else if (value === null || type === "boolean" || type === "number" || type === "string" || value instanceof Date)
            output[key] = value;
    }
    if (info.uuid && !output[info.primaryColumn])
        output[info.primaryColumn] = v4();
    return output;
}