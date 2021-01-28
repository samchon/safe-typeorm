/**
 * Creator type of a model class.
 * 
 * @template Instance Target class type.
 * @author Jeongho Nam - https://github.com/samchon
 */
export type CreatorType<Instance extends Object> = 
{
    new(...args: any[]): Instance;
};