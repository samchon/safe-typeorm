import { Creator } from "../typings";
import { JsonSelectBuilder } from "../builders/JsonSelectBuilder";

export function createJsonSelectBuilder<Mine extends object, InputT extends JsonSelectBuilder.Input<Mine>>
    (creator: Creator<Mine>, input: InputT): JsonSelectBuilder<Mine, InputT>;

export function createJsonSelectBuilder<
        Mine extends object, 
        InputT extends JsonSelectBuilder.Input<Mine>,
        Destination>
    (
        creator: Creator<Mine>, 
        input: InputT,
        closure: JsonSelectBuilder.OutputMapper<Mine, InputT, Destination>
    ): JsonSelectBuilder<Mine, InputT, Destination>;

export function createJsonSelectBuilder<
        Mine extends object, 
        InputT extends JsonSelectBuilder.Input<Mine>,
        Destination = JsonSelectBuilder.Output<Mine, InputT>>
    (
        creator: Creator<Mine>, 
        input: InputT,
        closure?: JsonSelectBuilder.OutputMapper<Mine, InputT, Destination>
    ): JsonSelectBuilder<Mine, InputT, Destination> 
{
    return new JsonSelectBuilder(creator, input, closure!);
}