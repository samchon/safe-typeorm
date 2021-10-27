import { Creator } from "../typings";
import { JsonSelectBuilder } from "../builders/JsonSelectBuilder";

export function createJsonSelectBuilder<
        Mine extends object, 
        InputT extends JsonSelectBuilder.Input<Mine>,
        Destination = JsonSelectBuilder.Output<Mine, InputT>>
    (
        creator: Creator<Mine>, 
        input: Readonly<InputT>,
        closure?: JsonSelectBuilder.Output.Mapper<Mine, InputT, Destination>
    ): JsonSelectBuilder<Mine, InputT, Destination> 
{
    return new JsonSelectBuilder(creator, input, closure);
}