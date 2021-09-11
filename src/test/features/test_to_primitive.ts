import safe from "../..";
import { generate_random_clean_groups } from "../generators/generate_random_clean_groups";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsGroup } from "../models/BbsGroup";

export async function test_to_primitive(): Promise<void>
{
    const groups: BbsGroup[] = await generate_random_clean_groups();
    const articles: BbsArticle[] = await groups[0].articles.get();
    const contents: BbsArticleContent[] = await articles[0].contents.get();

    const primitive: safe.typings.Primitive<BbsArticleContent> = safe.toPrimitive(contents[0]);

    // TYPE CHECKING
    const regular: IContent = primitive;
    const reverse: typeof primitive = regular;
    reverse;

    // FK MUST BE ERASED
    if ((primitive as any).bbs_article_id)
        throw new Error("Bug on toPrimitive(): FK value must not be written in.");
}

interface IContent
{
    id: string;
    title: string;
    body: string;
    created_at: string;
}