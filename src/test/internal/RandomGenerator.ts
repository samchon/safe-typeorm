import { randint } from "tstl/algorithm/random";

export namespace RandomGenerator
{
    const a = "a".charCodeAt(0);
    const z = "z".charCodeAt(0);

    export function characters(length: number = 3): string
    {
        let ret: string = "";
        for (let i: number = 0; i < length; ++i)
            ret += String.fromCharCode(randint(a, z));
        
        return ret;
    }

    export function repeat<T>(n: number, closure: (index: number) => T): T[]
    {
        let ret: T[] = [];
        for (let i: number = 0; i < n; ++i)
            ret.push(closure(i));
        return ret;
    }
}