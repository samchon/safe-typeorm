import { DefaultNamingStrategy } from "typeorm";
import pluralize from "pluralize";

export class NamingStrategy extends DefaultNamingStrategy
{
    public tableName(targetName: string, userSpecifiedName: string | undefined): string
    {
        if (userSpecifiedName === undefined)
            userSpecifiedName = pluralize(pascal_to_snake(targetName));
        return userSpecifiedName;
    }

    public columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string
    {
        if (!customName)
            customName = propertyName;
        return [...embeddedPrefixes, customName].map(str => pascal_to_snake(str)).join("_");
    }

    public relationName(propertyName: string): string
    {
        return pascal_to_snake(propertyName);
    }

    public prefixTableName(prefix: string, tableName: string): string
    {
        return `${prefix}_${tableName}`;
    }
}

function pascal_to_snake(name: string): string
{
    let elements: string[] = name.split(/(?=[A-Z])/);
    if (elements.length > 1 && is_underscore_prefixed(elements[0]) === true)
        elements = [ elements[0] + elements[1], ...elements.slice(2) ];

    return elements.map(str => str.toLowerCase()).join("_");
}

function is_underscore_prefixed(str: string): boolean
{
    for (let ch of str)
        if (ch !== "_")
            return false;
    return true;
}