import { Creator } from "../typings/Creator";
import { Field } from "../typings/Field";
import { SpecialFields } from "../typings/SpecialFields";

import { get_column_name_tuple } from "./internal/get_column_name_tuple";

/**
 * Get column name.
 *
 * `getColumn()` is a global function returning the column name.
 *
 * Unlike writing the column name by yourself manually who can result in the critical runtime
 * error by a typing error, the `getColumn()` can detect the typing error in the compilation level.
 *
 * The `getColumn()` even supports the table alias, therefore the table alias addicted column name
 * also can take advantage of the compile time validation. In such reason, if you don't ignore
 * error message from the TypeScript compiler, there can't be any runtime error that is caused by
 * the mis-typing error in the SQL column specification level.
 *
 * @template T Type of a model class
 * @template Literal Type of a literal who represents the field that is defined in the *T* model
 * @param fieldLike Name of the target field in the model class. The field name can contain the
 *                  table alias.
 * @param alias Alias of the target column
 * @return The exact column name who never can be the runtime error
 */
export function getColumn<
    T extends object,
    Literal extends SpecialFields<T, Field>,
>(
    creator: Creator<T>,
    fieldLike: `${Literal}` | `${string}.${Literal}`,
    alias?: string | null,
): string {
    const tuple: [string, string] = get_column_name_tuple(creator, fieldLike);
    if (alias === undefined) alias = tuple[1];

    const target: string = tuple[0] ? `${tuple[0]}.${tuple[1]}` : tuple[1];
    return alias === null ? target : `${target} AS ${alias}`;
}
