import { AppJoinBuilder } from "../builders/AppJoinBuilder";
import { Creator } from "../typings/Creator";

export function appJoin<T extends object>(source: T[], closure: AppJoinBuilder.Closure<T>): Promise<void>;
export function appJoin<T extends object>(source: T, closure: AppJoinBuilder.Closure<T>): Promise<void>;

export function appJoin<T extends object>
    (source: T[] | T, closure: AppJoinBuilder.Closure<T>): Promise<void>
{
    return _App_join
    (
        source instanceof Array ? source : [source],
        closure
    );
}

async function _App_join<T extends object>
    (
        from: T[], 
        closure: AppJoinBuilder.Closure<T>
    ): Promise<void>
{
    const builder: AppJoinBuilder<T> = new AppJoinBuilder(from[0].constructor as Creator<T>);
    closure(builder);
    await builder.mount(from);
}