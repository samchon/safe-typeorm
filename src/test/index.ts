import * as fs from "fs";
import * as orm from "typeorm";
import { randint } from "tstl/algorithm/random";

import { NamingStrategy } from "../utils/NamingStrategy";
import { RandomGenerator } from "./internal/RandomGenerator";
import { AttachmentFile } from "./models/AttachmentFile";
import { BbsArticle } from "./models/BbsArticle";
import { BbsArticleCover } from "./models/BbsArticleCover";
import { BbsArticleFilePair } from "./models/BbsArticleFilePair";
import { BbsComment } from "./models/BbsComment";
import { BbsGroup } from "./models/BbsGroup";
import { validate_equality } from "./internal/validate_equality";

/* -----------------------------------------------------------
    RAW DATA
----------------------------------------------------------- */
interface IBbsGroup
{
    code: string;
    name: string;
    articles: IBbsArticle[];
}
interface IBbsArticle extends IContent
{
    title: string;
    cover: IBbsArticle.ICover | null;
    files: IAttachmentFile[];

    comments: IBbsComment[];
}
namespace IBbsArticle
{
    export interface ICover
    {
        file: IAttachmentFile;
        sub_title: string;
    }
}
type IBbsComment = IContent;

interface IContent
{
    writer: string;
    content: string;
}
interface IAttachmentFile
{
    name: string;
    extension: string;
    path: string;
}

function create_raw_content(): IContent
{
    return {
        writer: RandomGenerator.characters(randint(5, 10)),
        content: RandomGenerator.characters(randint(5, 10))
    };
}

function create_raw_file(): IAttachmentFile
{
    let name: string = RandomGenerator.characters(randint(5, 10));
    let extension: string = RandomGenerator.characters(3);

    return {
        name: name,
        extension: extension,
        path: `http://127.0.0.1/files/${name}.${extension}`
    };
}

function create_raw_groups(): IBbsGroup[]
{
    return RandomGenerator.repeat(3, index => ({
        code: RandomGenerator.characters(8) + index,
        name: RandomGenerator.characters(8),
        articles: RandomGenerator.repeat(randint(3, 10), () => ({
            ...create_raw_content(),
            title: RandomGenerator.characters(10),
            cover: Math.random() < .5 ? null : {
                sub_title: RandomGenerator.characters(10),
                file: create_raw_file()
            },
            files: RandomGenerator.repeat(randint(0, 4), () => create_raw_file()),
            comments: RandomGenerator.repeat(randint(0, 3), () => create_raw_content())
        }))
    }));
}

/* -----------------------------------------------------------
    MODEL ARCHIVERS
----------------------------------------------------------- */
async function archive_file(rawFile: IAttachmentFile): Promise<AttachmentFile>
{
    let ret: AttachmentFile = new AttachmentFile();
    ret.name = rawFile.name;
    ret.extension = rawFile.extension;
    ret.path = rawFile.path;
    return await ret.save();
}

async function archive_groups(rawGroupList: IBbsGroup[]): Promise<BbsGroup[]>
{
    const ret: BbsGroup[] = [];
    for (const rawGroup of rawGroupList)
    {
        const group: BbsGroup = new BbsGroup();
        group.code = rawGroup.code;
        group.name = rawGroup.name;
        await group.save();

        ret.push(group);

        for (let rawArticle of rawGroup.articles)
        {
            let article: BbsArticle = new BbsArticle();
            article.group.set(group);
            article.writer = rawArticle.writer;
            article.title = rawArticle.title;
            article.content = rawArticle.content;
            await article.password.set(RandomGenerator.characters(8));
            await article.save();

            if (rawArticle.cover !== null)
            {
                let cover: BbsArticleCover = new BbsArticleCover();
                cover.sub_title = rawArticle.cover.sub_title;
                cover.file.set(await archive_file(rawArticle.cover.file));
                cover.article.set(article);
                await cover.save();
            }

            for (let rawFile of rawArticle.files)
            {
                let pair: BbsArticleFilePair = new BbsArticleFilePair();
                pair.file.set(await archive_file(rawFile));
                pair.article.set(article);
                await pair.save();
            }

            for (let rawComment of rawArticle.comments)
            {
                let comment: BbsComment = new BbsComment();
                comment.article.set(article);
                comment.writer = rawComment.writer;
                comment.content = rawComment.content;
                await comment.password.set(RandomGenerator.characters(8));
                await comment.save();
            }
        }
    }
    return await BbsGroup.find();
}

/* -----------------------------------------------------------
    SERIALIZER
----------------------------------------------------------- */
async function map<T, Ret>(elements: T[], closure: (elem: T) => Promise<Ret>): Promise<Ret[]>
{
    let ret: Ret[] = [];
    for (let elem of elements)
        ret.push(await closure(elem));
    return ret;
}

function serialize(groupList: BbsGroup[]): Promise<IBbsGroup[]>
{
    return map(groupList, async group =>
    ({
        code: group.code,
        name: group.name,
        articles: await map(await group.articles.get(), async article =>
        {
            const cover: BbsArticleCover | null = await article.cover.get();

            return {
                writer: article.writer,
                title: article.title,
                content: article.content,

                cover: (cover === null) ? null :{
                    sub_title: cover.sub_title,
                    file: {
                        name: (await cover.file.get()).name,
                        extension: (await cover.file.get()).extension,
                        path: (await cover.file.get()).path
                    }
                },
                files: (await article.files.get()).map(file => ({
                    name: file.name,
                    extension: file.extension,
                    path: file.path
                })),
                comments: await map(await article.comments.get(), async comment => ({
                    writer: comment.writer,
                    content: comment.content
                }))
            }
        })
    }));
}

async function validate(original: IBbsGroup[], records: BbsGroup[]): Promise<void>
{
    const group = records[0];
    const article = (await group.articles.get())[0];
    const comment = (await article.comments.get())[0];

    console.log(group?.toJSON(), article?.toJSON(), comment?.toJSON());

    const deserialized: IBbsGroup[] = await serialize(records);
    validate_equality(original, deserialized);
}

/* -----------------------------------------------------------
    THE MAIN FUNCTION
----------------------------------------------------------- */
async function main(): Promise<void>
{
    //----
    // PRELIMINARIES
    //----
    // CREATE DIRECTORY
    try { await fs.promises.mkdir(__dirname + "/../../assets") } catch {}

    // CONNECT TO THE DB
    const connection: orm.Connection = await orm.createConnection({
        type: "mariadb",
        host: "127.0.0.1",
        port: 3306,
        username: "root",
        password: "root",
        database: "safe_typeorm_test",
        namingStrategy: new NamingStrategy(),
        entities: [`${__dirname}/models/**/*.${__filename.substr(-2)}`]
    });
    
    // RESET SCHEMA AND CREATE TABLES
    await connection.dropDatabase();
    await connection.synchronize();

    //----
    // ACTIONS
    //----
    // CREATE RAW DATA
    const rawGroups: IBbsGroup[] = create_raw_groups();
    await fs.promises.writeFile(__dirname + "/../../assets/raw.json", JSON.stringify(rawGroups, null, 4), "utf8");
    
    // ARCHIVE THEM
    const modelGroups: BbsGroup[] = await archive_groups(rawGroups);
    const output: IBbsGroup[] = await serialize(modelGroups);
    await fs.promises.writeFile(__dirname + "/../../assets/output.json", JSON.stringify(output, null, 4), "utf8");

    // LOAD WITH JOIN
    await validate(rawGroups, await BbsGroup.createJoinQueryBuilder(group => group.innerJoin("articles").innerJoin("comments")).getMany());
    await fs.promises.writeFile(__dirname + "/../../assets/eager.json", JSON.stringify(await serialize(await BbsGroup.createJoinQueryBuilder(group => group.innerJoinAndSelect("articles").innerJoinAndSelect("comments")).getMany()), null, 4));
    
    // COMPARE RAW & MODEL
    validate_equality(rawGroups, output);
    await connection.close();
}
main();