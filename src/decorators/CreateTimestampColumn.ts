import { ColumnOptions, CreateDateColumn } from "typeorm";

/**
 * Creation timstamp column for `postgres`.
 *
 * When defining datetime column, time zone is very important when considering global
 * service. However, default `CreateDateColumn` of `typeorm` does not archive the time zone
 * when using `postgres` database. Furthermore, `typeorm` does not archive milliseconds.
 *
 * I think it's a critical mistake of `typeorm`, but they think it's not a bug but spec.
 *
 * Therefore, `safe-typeorm` supports custom creation timestamp column which supports time
 * zone and milliseconds. When using `postgres` database, use this `CreateTimestampColumn`
 * instead of the `CreateDateColumn`.
 *
 * @param options Additional options if required
 * @returns Property decorator function
 */
export const CreateTimestampColumn = (options?: ColumnOptions) =>
    CreateDateColumn({
        ...(options || {}),
        precision: 3,
        type: "timestamp with time zone",
    });
