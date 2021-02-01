/**
 * Creator type of a class.
 * 
 * @template T The target class type.
 * @author Jeongho Nam - https://github.com/samchon
 */
export type Creator<T extends Object> = 
{
    new(...args: any[]): T;
};

export namespace Creator
{
    export type Generator<T extends object> = () => Creator<T>;
}