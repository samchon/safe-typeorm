import { IPointer } from "tstl/functional/IPointer";

/**
 * @internal
 */
export namespace ClosureProxy {
    export function steal<Func extends Closure<any, any>>(func: Func): string {
        const ret: IPointer<string> = { value: "" };
        func(
            new Proxy(
                {},
                {
                    get: ({}, name: string) => {
                        ret.value = name;
                    },
                },
            ),
        );
        return ret.value;
    }

    type Closure<Input, Output> = (input: Input) => Output;
}
