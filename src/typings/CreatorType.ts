/**
 * Creator type of a class.
 * 
 * @template T The target class type.
 * @author Jeongho Nam - https://github.com/samchon
 */
export type CreatorType<T extends Object> = 
{
    new(...args: any[]): T;
};