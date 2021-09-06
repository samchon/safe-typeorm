import { BbsGroup } from "../models/BbsGroup";

export async function iterate_bbs_group(group: BbsGroup): Promise<void>
{
    for (const article of await group.articles.get())
    {
        await article.group.get();
        for (const content of await article.contents.get())
        {
            await content.article.get();
            await content.files.get();
        }
        for (const comment of await article.comments.get())
        {
            await comment.article.get();
            await comment.files.get();
        }
    }
}