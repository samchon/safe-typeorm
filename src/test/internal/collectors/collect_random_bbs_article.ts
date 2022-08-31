import { randint } from "tstl";

import safe from "../../..";
import { ArrayUtil } from "../../../utils/ArrayUtil";
import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsArticleContent } from "../../models/bbs/BbsArticleContent";
import { BbsGroup } from "../../models/bbs/BbsGroup";
import { __MvBbsArticleLastContent } from "../../models/bbs/__MvBbsArticleLastContent";
import { prepare_random_bbs_article } from "../preparations/prepare_random_bbs_article";
import { collect_random_bbs_article_content } from "./collect_random_bbs_article_content";

export async function collect_random_bbs_article(
    collection: safe.InsertCollection,
    group: BbsGroup,
    created_at: Date = new Date(),
    contentCount: number = randint(1, 4),
    fileCount: () => number = () => randint(0, 9),
): Promise<BbsArticle> {
    const article: BbsArticle = prepare_random_bbs_article(group, created_at);
    const contents: BbsArticleContent[] = await ArrayUtil.asyncRepeat(
        contentCount,
        (index) =>
            collect_random_bbs_article_content(
                collection,
                article,
                new Date(created_at.getTime() + index * 1000),
                fileCount(),
            ),
    );
    const last: __MvBbsArticleLastContent =
        __MvBbsArticleLastContent.initialize({
            article,
            content: contents[contents.length - 1],
        });

    collection.push(article);
    collection.push(last);

    await article.__mv_last.set(last);
    await article.contents.set(contents);
    return article;
}
