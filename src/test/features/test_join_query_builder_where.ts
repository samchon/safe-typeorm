import safe from "../..";
import { BbsGroup } from "../models/bbs/BbsGroup";
import { IBbsGroup } from "../structures/IBbsGroup";
import { test_json_select_builder } from "./test_json_select_builder";

export async function test_join_query_builder_where() {
    const json: IBbsGroup[] = await test_json_select_builder();

    const builder: safe.JoinQueryBuilder<BbsGroup> =
        BbsGroup.createJoinQueryBuilder();
    builder.innerJoin("articles", (article) => {
        article.innerJoin("contents", "BC", (content) => {
            content.orWhere("title", json[1].articles[0].contents[0].title);
        });
        article.orWhere("id", () => `'${json[2].articles[0].id}'`);
    });
    builder.orWhere("code", json[0].code);

    const groups: BbsGroup[] = await builder.statement().distinct().getMany();
    if (groups.length !== 3) {
        console.log(groups.length);
        throw new Error(
            "Bug on JoinQueryBuilder.where(): failed to understand where query.",
        );
    }
}
