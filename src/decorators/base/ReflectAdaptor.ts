import { Belongs } from "../Belongs";
import { Has } from "../Has";

/**
 * @internal
 */
export namespace ReflectAdaptor
{
    export type Metadata<T extends object, Router extends object = any> = 
        Belongs.ManyToOne.IMetadata<T> | Belongs.External.ManyToOne.IMetadata<T> |
        Belongs.OneToOne.IMetadata<T> | Belongs.External.OneToOne.IMetadata<T> |
        Has.OneToOne.IMetadata<T> | Has.External.OneToOne.IMetadata<T> |
        Has.OneToMany.IMetadata<T> | Has.External.OneToMany.IMetadata<T> |
        Has.ManyToMany.IMetadata<T, Router>;

    export function set<T extends object, Router extends object = any>
        (
            $class: object,
            $property: string | symbol,
            input: Metadata<T, Router>
        ): void
    {
        Reflect.defineMetadata(key($property), input, $class);
    }

    export function get<T extends object, Router extends object = any>
        (
            $class: object,
            $property: string | symbol
        ): Metadata<T, Router> | undefined
    {
        return Reflect.getMetadata(key($property), $class);
    }

    function key(property: string | symbol): string
    {
        return `SafeTypeORM:Relationship:${property as string}`;
    }
}