import { is_sorted } from "tstl/ranges/algorithm";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsComment } from "../models/BbsComment";
import { BbsGroup } from "../models/BbsGroup";

export async function iterate_bbs_group(group: BbsGroup): Promise<void>
{
    for (const article of await group.articles.get())
    {
        await article.group.get();

        // CONTENTS
        const contentList: BbsArticleContent[] = await article.contents.get();
        if (is_sorted(contentList, (x, y) => x.created_at.getTime() < y.created_at.getTime()) === false)
            throw new Error("Bug on Has.OneToMany(): not sorted.");

        for (const content of contentList)
        {
            await content.article.get();
            await content.files.get();
        }

        // COMMENTS
        const commentList: BbsComment[] = await article.comments.get();
        if (is_sorted(commentList, (x, y) => x.created_at.getTime() < y.created_at.getTime()) === false)
            throw new Error("Bug on Has.OneToMany(): not sorted.");

        for (const comment of commentList)
        {
            await comment.article.get();
            await comment.files.get();
        }
    }
}