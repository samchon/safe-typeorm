import * as orm from "typeorm";

/**
 * @internal
 */
export function take_default_cascade_options<
    Options extends Pick<orm.RelationOptions, "lazy" | "onDelete" | "onUpdate">,
>(options: Options): Options {
    const ret: Options = { ...options };
    if (ret.onDelete === undefined) ret.onDelete = "CASCADE";
    if (ret.onUpdate === undefined) ret.onUpdate = "CASCADE";

    ret.lazy = true;
    return ret;
}
