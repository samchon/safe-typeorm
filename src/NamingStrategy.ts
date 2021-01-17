import * as orm from  "typeorm";
import pluralize from "pluralize";

export class NamingStrategy extends orm.DefaultNamingStrategy
{
    public tableName(targetName: string, userSpecifiedName: string | undefined): string
    {
        if (userSpecifiedName === undefined)
            userSpecifiedName = pluralize(pascal_to_snake(targetName));
        return userSpecifiedName;
    }
}

function pascal_to_snake(name: string): string
{
    return name.split(/(?=[A-Z])/).map(str => str.toLowerCase()).join("_");
}