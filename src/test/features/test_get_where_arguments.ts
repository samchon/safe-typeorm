import { BbsArticle } from "../models/bbs/BbsArticle";

export function test_get_where_arguments(): void {
    BbsArticle.getWhereArguments("created_at", "<", () => "NOW()");
}