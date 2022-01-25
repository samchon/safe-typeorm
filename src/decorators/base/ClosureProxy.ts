/**
 * @internal
 */
export namespace ClosureProxy
{
    export function steal<Func extends Closure<any, any>>(func: Func): string
    {
        let ret!: string;
        func(new Proxy({}, 
        {
            get: ({}, name: string) =>
            {
                ret = name;
            }
        }));
        return ret;
    }

    type Closure<Input, Output> = (input: Input) => Output;
}