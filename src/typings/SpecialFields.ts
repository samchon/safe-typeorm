/**
 * Pick special fields meeting special type.
 * 
 * @template Instance The instance type to be filtered.
 * @template Target The target type to be picked up.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export type SpecialFields<Instance extends object, Target> =
{
    [P in keyof Instance]: Instance[P] extends Target ? P : never;
}[keyof Instance & string];