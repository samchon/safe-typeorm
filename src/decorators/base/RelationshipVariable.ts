/**
 * @internal
 */
export namespace RelationshipVariable
{
    export function helper(type: "has" | "belongs", property: string)
    {
        return `__m_${type}_${property}_helper__`;
    }

    export function getter(type: "has" | "belongs", property: string)
    {
        return `__m_${type}_${property}_getter__`;
    }
}