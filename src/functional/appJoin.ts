import { AppJoinBuilder } from "../builders/AppJoinBuilder";

export function appJoin<T extends object>
    (source: T, closure: () => void): Promise<void>;

export function appJoin<T extends object>
    (source: T[], closure: () => void): Promise<void>;

export async function appJoin<T extends object>
    (
        from: T | T[], 
        closure: AppJoinBuilder.Closure<T>
    ): Promise<void>
{
    from;
    closure;
}