import * as orm from "typeorm";
import { DynamicImportIterator } from "./internal/procedures/DynamicImportIterator";
import { TestLogger } from "./internal/procedures/TestLogger";

async function main(): Promise<void>
{
    const connection: orm.Connection = await orm.createConnection({
        type: "sqlite",
        database: ":memory:",
        // type: "mariadb",
        // database: "safe_typeorm_test",
        // username: "root",
        // password: "root",
        // host: "127.0.0.1",
        entities: [`${__dirname}/models/**/*.${__filename.substr(-2)}`],
        logger: TestLogger
    });
    await connection.dropDatabase();
    await connection.synchronize();

    await DynamicImportIterator.main
    (
        `${__dirname}/features`, 
        {
            prefix: "test",
            parameters: []
        }
    );
    await connection.close();
}
main().catch(exp =>
{
    console.log(exp);
    process.exit(-1);
});