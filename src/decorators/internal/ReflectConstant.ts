export namespace ReflectConstant
{
    export function type(property: string | symbol): string
    {
        return `SafeTypeORM:Relationship:${property as string}:type`;
    }

    export function target(property: string | symbol): string
    {
        return `SafeTypeORM:Relationship:${property as string}:target`;
    }

    export function router(property: string | symbol): string
    {
        return `SafeTypeORM:Relationship:${property as string}:router`;
    }

    export function foreign_key_field(property: string | symbol): string
    {
        return `SafeTypeORM:Relationship:${property as string}:foreign_key_field`;
    }

    export function inverse(property: string | symbol): string
    {
        return `SafeTypeORM:Relationship:${property as string}:inverse`;
    }
}