import { OutOfRange } from "tstl/exception/OutOfRange";

import { get_app_join_function } from "../builders/internal/get_app_join_function";

import { Has } from "../decorators/Has";
import { ReflectAdaptor } from "../decorators/base/ReflectAdaptor";

import { Creator } from "../typings/Creator";
import { Relationship } from "../typings/Relationship";
import { SpecialFields } from "../typings/SpecialFields";

export function appJoin<
    Mine extends object,
    Target extends object,
    Accessor extends SpecialFields<Mine, Relationship<Target>>,
>(mine: Mine[], accessor: Accessor): Promise<Target[]>;

export function appJoin<
    Mine extends object,
    Target extends object,
    Accessor extends SpecialFields<Mine, Relationship<Target>>,
>(mine: Mine[], accessor: Accessor, target: Target[]): Promise<Target[]>;

export function appJoin<
    Mine extends object,
    Target extends object,
    Router extends object,
    Accessor extends SpecialFields<Mine, Has.ManyToMany<Target, Router>>,
>(
    mine: Mine[],
    accessor: Accessor,
    target: Target[],
    routers: Router[],
): Promise<Target[]>;

export async function appJoin<
    Mine extends object,
    Target extends object,
    Accessor extends SpecialFields<Mine, Relationship<Target>>,
>(mine: Mine[], accessor: Accessor, ...args: any[]): Promise<Target[]> {
    // NO DATA
    if (mine.length === 0) return [];

    // GET METADATA
    const creator: Creator<Mine> = mine[0].constructor as Creator<Mine>;
    const metadata:
        | ReflectAdaptor.Metadata<Relationship.TargetType<Mine, any>>
        | undefined = ReflectAdaptor.get(creator.prototype, accessor);
    if (metadata === undefined)
        throw new OutOfRange(
            `Error on safe.appJoin(): unable to find the matched relationship accessor "${accessor}" from the "${creator.name}" class.`,
        );

    const options = {
        targetData: args[0] || null,
        routerData: args[1] || null,
    };

    // CALL THE APP JOIN FUNCTION
    const func: Function = get_app_join_function(metadata.type);
    return func(creator, metadata, mine, accessor, options);
}
