import * as orm from "typeorm";

/**
 * @internal
 */
export function take_foreign_column_options<Options extends orm.RelationOptions>
    (options: Options): Omit<Options, keyof orm.RelationOptions | "index">
{
    const ret: any = { ...options };
    for (const key of RELATION_OPTION_KEYS)
        if (ret[key] !== undefined)
            delete ret[key];

    return ret;
}

/**
 * @internal
 */
const RELATION_OPTION_KEYS: Array<keyof orm.RelationOptions | "index"> = [
    "cascade", 
    "onDelete",
    "onUpdate",
    "deferrable",
    "lazy", 
    "eager", 
    "persistence", 
    "orphanedRowAction",
    "index"
];