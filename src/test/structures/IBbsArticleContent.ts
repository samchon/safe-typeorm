import { IAttachmentFile } from "./IAttachmentFile";

export interface IBbsArticleContent
{
    id: string;
    title: string;
    body: string;
    created_at: string;

    files: IAttachmentFile[];
}