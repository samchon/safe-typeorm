import { Factorial } from "cagen";

import { DEFAULT } from "../../DEFAULT";
import { InsertCollection } from "../../transactions/InsertCollection";

import { AttachmentFile } from "../models/AttachmentFile";
import { BbsArticle } from "../models/BbsArticle";
import { BbsArticleCover } from "../models/BbsArticleCover";
import { BbsComment } from "../models/BbsComment";
import { BbsGroup } from "../models/BbsGroup";

async function test(indexes: number[]): Promise<void>
{
    const collection: InsertCollection = new InsertCollection();

    const group: BbsGroup = BbsGroup.initialize({
        id: DEFAULT,
        parent: null,
        code: "some_special_code_" + Math.random(),
        name: "some_special_name"
    });

    const article: BbsArticle = BbsArticle.initialize({
        id: DEFAULT,
        group,
        parent: null,
        writer: "someone",
        title: "some title",
        content: "some article content",
        created_at: DEFAULT,
        updated_at: DEFAULT,
        deleted_at: null
    });
    await article.password.set("some_password");

    const file: AttachmentFile = AttachmentFile.initialize({
        id: DEFAULT,
        name: "some_file",
        extension: "jpg",
        path: "https://somewhere/some_file.jpg",
        created_at: DEFAULT
    });

    const cover: BbsArticleCover = BbsArticleCover.initialize({
        id: DEFAULT,
        file,
        article,
        sub_title: "some subtitle"
    });

    const comment: BbsComment = BbsComment.initialize({
        id: DEFAULT,
        article,
        parent: null,
        writer: "someone",
        content: "some comment content",
        created_at: DEFAULT,
        updated_at: DEFAULT,
        deleted_at: null
    });

    const recordList = [group, article, file, cover, comment];
    for (const index of indexes)
        collection.push(recordList[index], true);

    await collection.execute();
}

export async function test_insert_collection(): Promise<void>
{
    const factorial: Factorial = new Factorial(5);
    for (let i: number = 0; i < factorial.size(); ++i)
        await test(factorial.at(i));
}