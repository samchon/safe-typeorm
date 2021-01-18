import pluralize from "pluralize";
import { DefaultNamingStrategy } from "typeorm";

export class NamingStrategy extends DefaultNamingStrategy
{
    public tableName(targetName: string, userSpecifiedName: string | undefined): string
    {
        if (userSpecifiedName === undefined)
            userSpecifiedName = pluralize(pascal_to_snake(targetName));
        return userSpecifiedName;
    }

    public closureJunctionTableName(originalClosureTableName: string): string
    {
        return pluralize(pascal_to_snake(originalClosureTableName)) + "_closure";
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
}

function pascal_to_snake(name: string): string
{
    return name.split(/(?=[A-Z])/).map(str => str.toLowerCase()).join("_");
}

// function get_composite_name(tableOrName: Table | string, columnNames: string[], where?: string): string
// {
//     if (tableOrName instanceof Table)
//     {
//         const index: number = tableOrName.name.indexOf(".");
//         tableOrName = tableOrName.name.substr(index + 1);
//     }

//     const tuple: string[] = [pluralize(tableOrName), ...columnNames];
//     if (where)
//         tuple.push(where);
//     return tuple.map(str => pascal_to_snake(str)).join("_");
// }