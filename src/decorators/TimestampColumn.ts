import { Column } from "typeorm";
import { ColumnCommonOptions } from "typeorm/decorator/options/ColumnCommonOptions";
import { ColumnNumericOptions } from "typeorm/decorator/options/ColumnNumericOptions";

export const TimestampColumn = (
    options?: ColumnCommonOptions & Omit<ColumnNumericOptions, "precision">,
) =>
    Column("timestamp with time zone", {
        ...(options || {}),
        precision: 3,
    });
