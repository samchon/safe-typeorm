import { randint } from "tstl";
import safe from "../../..";
import { ArrayUtil } from "../../../utils/ArrayUtil";
import { AttachmentFile } from "../../models/bbs/AttachmentFile";
import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsArticleContent } from "../../models/bbs/BbsArticleContent";
import { BbsArticleContentFile } from "../../models/bbs/BbsArticleContentFile";
import { prepare_random_attachment_file } from "../preparations/prepare_random_attachment_file";
import { prepare_random_bbs_article_content } from "../preparations/prepare_random_bbs_article_content";

export async function collect_random_bbs_article_content
    (
        collection: safe.InsertCollection,
        article: BbsArticle,
        created_at: Date = new Date(),
        fileCount: number = randint(0, 9)
    ): Promise<BbsArticleContent>
{
    const content: BbsArticleContent = prepare_random_bbs_article_content(article, created_at);
    const files: AttachmentFile[] = ArrayUtil.repeat(fileCount, index =>
    {
        const file: AttachmentFile = prepare_random_attachment_file("jpg");
        const pair: BbsArticleContentFile = BbsArticleContentFile.initialize({
            id: safe.DEFAULT,
            content,
            file,
            sequence: index + 1
        });
        collection.push(pair);
        return collection.push(file);
    });
    await content.files.set(files);
    return collection.push(content);
}