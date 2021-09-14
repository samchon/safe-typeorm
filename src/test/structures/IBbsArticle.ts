import { IBbsArticleContent } from "./IBbsArticleContent";
import { IBbsCategory } from "./IBbsCategory";

export interface IBbsArticle
{
    id: string;
    writer: string;
    ip: string;
    created_at: string;
    deleted_at: string | null;

    group: string;
    tags: string[];
    category: IBbsCategory | null;
    contents: IBbsArticleContent[];
}