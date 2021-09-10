import * as orm from "typeorm";
import { DynamicImportIterator } from "./internal/DynamicImportIterator";
import { TestLogger } from "./internal/TesLogger";

async function main(): Promise<void>
{
    const connection: orm.Connection = await orm.createConnection({
        type: "sqlite",
        database: __dirname + "/../../assets/db.dat",
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