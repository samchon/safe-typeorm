import * as orm from "typeorm";
import safe from "..";
import { DynamicImportIterator } from "./internal/DynamicImportIterator";
import { TestLogger } from "./internal/TesLogger";

async function main(): Promise<void>
{
    const connection: orm.Connection = await orm.createConnection({
        type: "mariadb",
        host: "127.0.0.1",
        port: 3306,
        username: "root",
        password: "root",
        database: "safe_typeorm_test",
        namingStrategy: new safe.SnakeCaseStrategy(),
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