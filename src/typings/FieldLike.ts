export type FieldLike<Literal extends string> =
    | Literal
    | [Literal, (str: string) => string];
