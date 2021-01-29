import { BbsArticle } from "../models/BbsArticle";
import { BbsGroup } from "../models/BbsGroup";

export function test_get_column(): void
{
    BbsGroup.getColumn("code");
    BbsGroup.getColumn("BG.code");

    BbsArticle.getColumn("group");
    BbsArticle.getColumn("BG.group");
    BbsArticle.getColumn("parent");
    BbsArticle.getColumn("BA.deleted_at");
}