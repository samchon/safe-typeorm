export type CapsuleNullable<T, Param extends boolean | { nullable?: boolean }>
    = Param extends boolean
        ? Param extends true
            ? T | null
            : T
        : Param extends { nullable: true }
            ? T | null
            : T;