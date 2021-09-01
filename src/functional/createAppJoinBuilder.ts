import { AppJoinBuilder } from "../builders/AppJoinBuilder";
import { Creator } from "../typings/Creator";

export function createAppJoinBuilder<T extends object>
    (
        creator: Creator<T>,
        closure?: AppJoinBuilder.Closure<T>
    ): AppJoinBuilder<T>
{
    const builder: AppJoinBuilder<T> = new AppJoinBuilder(creator);
    if (closure !== undefined)
        closure(builder);
    return builder;
}