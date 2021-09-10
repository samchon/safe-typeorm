import { OmitNever } from "./OmitNever";

export type Primitive<T extends object> = OmitNever<
{
    [P in keyof T]: T[P] extends (number|string|boolean|Date|null)
        ? P extends `_${string}` | `${string}_` ? never
        : T[P] extends Date ? string
        : T[P] extends Date | null ? string | null
        : T[P]
        : never;
}>;