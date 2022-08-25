import { ColumnOptions, UpdateDateColumn } from "typeorm";

/**
 * Update timstamp column for `postgres`.
 * 
 * When defining datetime column, time zone is very important when considering global
 * service. However, default `UpdateDateColumn` of `typeorm` does not archive the time zone
 * when using `postgres` database. Furthermore, `typeorm` does not archive milliseconds.
 * 
 * I think it's a critical mistake of `typeorm`, but they think it's not a bug but spec.
 * 
 * Therefore, `safe-typeorm` supports custom update timestamp column which supports time
 * zone and milliseconds. When using `postgres` database, use this `UpdateTimestampColumn` 
 * instead of the `UpdateDateColumn`.
 * 
 * @param options Additional options if required
 * @returns Property decorator function
 */
export const UpdateTimestampColumn = (options?: ColumnOptions) =>
    UpdateDateColumn({
        ...(options || {}),
        precision: 3,
        type: "timestamp with time zone",
    });
