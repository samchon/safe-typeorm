/**
 * Creator type of a class.
 * 
 * @template Instance Target class type.
 * @author Jeongho Nam - https://github.com/samchon
 */
export type CreatorType<Instance> = 
{
    new(...args: any[]): Instance;
};