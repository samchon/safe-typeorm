import * as orm from "typeorm";

export function take_foreign_column_options<Options extends orm.RelationOptions>
    (options: Options): Omit<Options, keyof orm.RelationOptions>
{
    const ret: any = { ...options };
    for (const key of RELATION_OPTION_KEYS)
        if (ret[key] !== undefined)
            delete ret[key];

    return ret;
}

const RELATION_OPTION_KEYS: Array<keyof orm.RelationOptions> = [
    "cascade", 
    "onDelete",
    "onUpdate",
    "deferrable",
    "lazy", 
    "eager", 
    "persistence", 
    "orphanedRowAction"
];