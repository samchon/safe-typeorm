import { PrimaryGeneratedColumn } from "typeorm";

/**
 * Decorator for auto incremental column.
 * 
 * @return The decorator function.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export function IncrementalColumn(): Function
{
    return PrimaryGeneratedColumn({ unsigned: true });
}