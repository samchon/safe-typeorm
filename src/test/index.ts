import * as orm from "typeorm";

import { NamingStrategy } from "../utils/NamingStrategy";
import { BbsArticle } from "./models/BbsArticle";
import { BbsComment } from "./models/BbsComment";
import { BbsGroup } from "./models/BbsGroup";

async function main(): Promise<void>
{
    const connection: orm.Connection = await orm.createConnection({
        type: "mariadb",
        host: "127.0.0.1",
        port: 3306,
        username: "root",
        password: "root",
        database: "safe_typeorm_test",
        namingStrategy: new NamingStrategy(),
        entities: [`${__dirname}/models/**/*.${__filename.substr(-2)}`]
    });
    await connection.dropDatabase();
    await connection.synchronize();

    const stmt = BbsGroup
        .createJoinQueryBuilder(group => group.innerJoin("articles").innerJoin("comments"))
        .andWhere(...BbsGroup.getWhereArguments("id", "IN", [1, 2, 3, 4]))
        .andWhere(...BbsArticle.getWhereArguments("id", 7))
        .andWhere(...BbsComment.getWhereArguments("content", "LIKE", "yeah~!"));
    console.log(stmt.getQueryAndParameters());

    await connection.close();
}
main();