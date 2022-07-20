export type WhereColumnType<Literal extends string> 
    = Literal 
    | [Literal, (str: string) => string];