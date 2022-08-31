import { ReflectAdaptor } from "../../decorators/base/ReflectAdaptor";

import { Creator } from "../../typings/Creator";
import { Field } from "../../typings/Field";
import { SpecialFields } from "../../typings/SpecialFields";

import { Belongs } from "../../decorators";

export function get_column_name_tuple<
    T extends object,
    Literal extends SpecialFields<T, Field>,
>(
    creator: Creator<T>,
    fieldLike: `${Literal}` | `${string}.${Literal}`,
): [string, string] {
    const index: number = (<string>fieldLike).indexOf(".");
    const [alias, field]: [string, Literal] =
        index === -1
            ? [creator.name, fieldLike as Literal]
            : [
                  fieldLike.substring(0, index),
                  fieldLike.substring(index + 1) as Literal,
              ];

    const metadata: ReflectAdaptor.Metadata<T, any> | undefined =
        ReflectAdaptor.get(creator.prototype, field);
    const fieldName: string =
        (metadata as Belongs.ManyToOne.IMetadata<T>)?.foreign_key_field ||
        field;

    return [alias, fieldName];
}
