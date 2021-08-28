import { HashSet } from "tstl/container/HashSet";
import { Pair } from "tstl/utility/Pair";
import { Creator, Relationship, SpecialFields } from "../typings";

export class AppJoinBuilder<Mine extends object>
{
    private constructor
        (
            private readonly creator_: Creator<Mine>,
            private readonly links_: HashSet<Pair<Creator<object>, string>>
        )
    {
    }

    /**
     * @internal
     */
    public static create<Mine extends object>
        (
            creator: Creator<Mine>,
            links: HashSet<Pair<Creator<object>, string>>
        ): AppJoinBuilder<Mine>
    {
        return new AppJoinBuilder(creator, links);
    }

    public join<Field extends SpecialFields<Mine, Relationship<any>>>
        (
            field: Field,
            closure?: AppJoinBuilder.Closure<Relationship.TargetType<Mine, Field>>
        ): void
    {
        this.links_.insert(new Pair(this.creator_, field));
        closure;
    }
}

export namespace AppJoinBuilder
{
    export type Closure<T extends object> = (builder: AppJoinBuilder<T>) => void;
}