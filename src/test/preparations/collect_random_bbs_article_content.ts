import { randint } from "tstl";
import safe from "../..";
import { ArrayUtil } from "../internal/ArrayUtil";
import { AttachmentFile } from "../models/AttachmentFile";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleContent } from "../models/BbsArticleContent";
import { BbsArticleContentFilePair } from "../models/BbsArticleContentFilePair";
import { prepare_random_attachment_file } from "./prepare_random_attachment_file";
import { prepare_random_bbs_article_content } from "./prepare_random_bbs_article_content";

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
        const pair: BbsArticleContentFilePair = BbsArticleContentFilePair.initialize({
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