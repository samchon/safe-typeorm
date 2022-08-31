import { IBbsArticle } from "./IBbsArticle";

export interface IBbsGroup {
    id: string;
    code: string;
    name: string;
    created_at: string;
    deleted_at: string | null;

    articles: IBbsArticle[];
}
