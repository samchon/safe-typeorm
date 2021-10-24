import { randint } from "tstl/algorithm/random";
import safe from "../../..";
import { ArrayUtil } from "../../../utils/ArrayUtil";
import { AttachmentFile } from "../../models/bbs/AttachmentFile";
import { BbsArticle } from "../../models/bbs/BbsArticle";
import { BbsComment } from "../../models/bbs/BbsComment";
import { BbsCommentFile } from "../../models/bbs/BbsCommentFile";
import { prepare_random_attachment_file } from "../preparations/prepare_random_attachment_file";
import { prepare_random_bbs_comment } from "../preparations/prepare_random_bbs_comment";

export async function collect_random_bbs_comment
    (
        collection: safe.InsertCollection, 
        article: BbsArticle,
        created_at: Date = new Date(),
        fileCount: number = randint(0, 3)
    ): Promise<BbsComment>
{
    const comment: BbsComment = prepare_random_bbs_comment(article, created_at);
    const files: AttachmentFile[] = ArrayUtil.repeat(fileCount, index =>
    {
        const file: AttachmentFile = prepare_random_attachment_file("jpg");
        const pair: BbsCommentFile = BbsCommentFile.initialize({
            id: safe.DEFAULT,
            comment,
            file,
            sequence: index + 1
        });
        collection.push(pair);
        return collection.push(file);
    });
    await comment.files.set(files);
    return collection.push(comment);
}