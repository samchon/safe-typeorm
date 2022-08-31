import { is_sorted } from "tstl/ranges/algorithm";

import { BbsArticleContent } from "../../models/bbs/BbsArticleContent";
import { BbsComment } from "../../models/bbs/BbsComment";
import { BbsGroup } from "../../models/bbs/BbsGroup";
import { BbsReviewArticle } from "../../models/bbs/BbsReviewArticle";

export async function iterate_bbs_group(
    group: BbsGroup,
    external: boolean,
): Promise<void> {
    for (const article of await group.articles.get()) {
        await article.group.get();
        await article.comments.get();

        await article.category.get();
        if ((await article.group.get()) !== group)
            throw new Error(
                "Bug on Belongs.ManyToOne.get(): different parent from BbsArticle.group.get().",
            );

        // REVIEW
        const review: BbsReviewArticle | null = await article.review.get();
        if (review !== null && (await review.base.get()) !== article)
            throw new Error(
                "Bug on Belongs.OneToOne.get(): different parent from BbsReviewArticle.get().",
            );

        // CONTENTS
        const contentList: BbsArticleContent[] = await article.contents.get();
        if (
            is_sorted(
                contentList,
                (x, y) => x.created_at.getTime() < y.created_at.getTime(),
            ) === false
        )
            throw new Error(
                "Bug on Has.OneToMany.get(): not sorted from BbsArticle.contents.get().",
            );

        for (const content of contentList) {
            if (article !== (await content.article.get()))
                throw new Error(
                    "Bug on Belongs.ManyToOne.get(): different parent from BbsArticleContent.article.get().",
                );
            await content.files.get();
        }

        // COMMENTS
        const commentList: BbsComment[] = await article.comments.get();
        if (
            is_sorted(
                commentList,
                (x, y) => x.created_at.getTime() < y.created_at.getTime(),
            ) === false
        )
            throw new Error(
                "Bug on Has.OneToMany(): not sorted from BbsArticle.comments.get().",
            );

        for (const comment of commentList) {
            if (article !== (await comment.article.get()))
                throw new Error(
                    "Bug on Belongs.ManyToOne.get(): different parent from BbsArticleComment.article.get().",
                );
            await comment.files.get();
        }

        // SCRAPS
        if (external === true)
            for (const scrap of await article.scraps.get()) {
                if ((await scrap.article.get()) !== article)
                    throw new Error(
                        "Bug on Belongs.External.ManyToOne.get(): different parent from BlogUserScrap.article.get().",
                    );

                await scrap.user.get();
            }
    }
}
