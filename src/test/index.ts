import * as orm from "typeorm";
import safe from "..";

import { DynamicImportIterator } from "./internal/procedures/DynamicImportIterator";
import { TestLogger } from "./internal/procedures/TestLogger";

async function main(): Promise<void>
{
    const schemas: string[] = ["bbs", "blog"];
    const connections: orm.Connection[] = await orm.createConnections(schemas.map(name => ({
        type: "sqlite",
        name,
        database: `${__dirname}/../../assets/${name}.db`,
        entities: [`${__dirname}/models/${name}/**/*.${__filename.substr(-2)}`],
        logger: TestLogger,
    })));
    safe.useConnections();

    await DynamicImportIterator.main
    (
        `${__dirname}/features`, 
        {
            prefix: "test",
            parameters: []
        }
    );
    for (const conn of connections)
        await conn.close();
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});