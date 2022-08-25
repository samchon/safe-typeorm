import { ColumnOptions, DeleteDateColumn } from "typeorm";

/**
 * Deletion timstamp column for `postgres`.
 * 
 * When defining datetime column, time zone is very important when considering global
 * service. However, default `DeleteDateColumn` of `typeorm` does not archive the time zone
 * when using `postgres` database. Furthermore, `typeorm` does not archive milliseconds.
 * 
 * I think it's a critical mistake of `typeorm`, but they think it's not a bug but spec.
 * 
 * Therefore, `safe-typeorm` supports custom deletion timestamp column which supports time
 * zone and milliseconds. When using `postgres` database, use this `DeleteTimestampColumn` 
 * instead of the `DeleteDateColumn`.
 * 
 * @param options Additional options if required
 * @returns Property decorator function
 */
export const DeleteTimestampColumn = (options?: ColumnOptions) =>
    DeleteDateColumn({
        ...(options || {}),
        precision: 3,
        type: "timestamp with time zone",
    });
