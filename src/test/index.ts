import * as fs from "fs";
import * as orm from "typeorm";
import { randint } from "tstl/algorithm/random";

import { SnakeCaseStrategy } from "../strategies/SnakeCaseStrategy";
import { RandomGenerator } from "./internal/RandomGenerator";
import { AttachmentFile } from "./models/AttachmentFile";
import { BbsArticle } from "./models/BbsArticle";
import { BbsArticleCover } from "./models/BbsArticleCover";
import { BbsArticleFilePair } from "./models/BbsArticleFilePair";
import { BbsComment } from "./models/BbsComment";
import { BbsGroup } from "./models/BbsGroup";

import { DEFAULT } from "../DEFAULT";
import { test_get_column } from "./features/test_get_column";
import { test_insert_collection } from "./features/test_insert_collection";
// import { validate_equality } from "./internal/validate_equality";

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
    const name: string = RandomGenerator.characters(randint(5, 10));
    const extension: string = RandomGenerator.characters(3);

    return {
        name,
        extension,
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
    const ret: AttachmentFile = AttachmentFile.initialize({
        id: DEFAULT,
        name: rawFile.name,
        extension: rawFile.extension,
        path: rawFile.path,
        created_at: DEFAULT
    });
    return await ret.save();
}

async function archive_groups(rawGroupList: IBbsGroup[]): Promise<BbsGroup[]>
{
    const ret: BbsGroup[] = [];
    for (const rawGroup of rawGroupList)
    {
        const group: BbsGroup = BbsGroup.initialize({
            id: DEFAULT,
            parent: null,
            code: rawGroup.code,
            name: rawGroup.name
        });
        await group.save();

        ret.push(group);

        for (const rawArticle of rawGroup.articles)
        {
            const article: BbsArticle = BbsArticle.initialize({
                id: DEFAULT,
                group,
                parent: null,
                writer: rawArticle.writer,
                title: rawArticle.title,
                content: rawArticle.content,
                created_at: DEFAULT,
                updated_at: DEFAULT,
                deleted_at: null
            });
            await article.password.set(RandomGenerator.characters(8));
            await article.save();

            if (rawArticle.cover !== null)
            {
                const cover: BbsArticleCover = BbsArticleCover.initialize({
                    id: DEFAULT,
                    article,
                    file: await archive_file(rawArticle.cover.file),
                    sub_title: rawArticle.cover.sub_title
                });
                await cover.save();
            }

            for (const rawFile of rawArticle.files)
            {
                const pair: BbsArticleFilePair = BbsArticleFilePair.initialize({
                    id: DEFAULT,
                    article,
                    file: await archive_file(rawFile),
                });
                await pair.save();
            }

            for (const rawComment of rawArticle.comments)
            {
                const comment: BbsComment = BbsComment.initialize({
                    id: DEFAULT,
                    article,
                    parent: null,
                    writer: rawComment.writer,
                    content: rawComment.content,
                    created_at: DEFAULT,
                    updated_at: DEFAULT,
                    deleted_at: null
                });
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
    const ret: Ret[] = [];
    for (const elem of elements)
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

async function validate(_original: IBbsGroup[], records: BbsGroup[]): Promise<void>
{
    const group = records[0];
    const article = (await group.articles.get())[0];
    const comment = (await article.comments.get())[0];

    console.log(group?.toPrimitive("id"), article?.toPrimitive("id"), comment?.toPrimitive("id"));
    console.log("article.bbs_group_id", article?.group.id);

    await serialize(records);
    // const deserialized: IBbsGroup[] = await serialize(records);
    // validate_equality(original, deserialized);
}

async function test_join(): Promise<void>
{
    const article: BbsArticle = await BbsArticle.findOneOrFail();

    const stmt = BbsGroup.createJoinQueryBuilder(group => group.innerJoin("articles"))
        .andWhere(...BbsGroup.getWhereArguments("id", article.group))
        // .orWhere(...BbsGroup.getWhereArguments("id", "IN", [1, 2, 3, article.group]))
        .select([
            BbsArticle.getColumn("id"),
            BbsArticle.getColumn("group"),
            BbsGroup.getColumn("name", "group"),
            BbsArticle.getColumn("title"),
            BbsArticle.getColumn("content"),
            BbsArticle.getColumn("created_at")
        ]);
    console.log(stmt.getSql());
    console.log(await stmt.getRawMany());

    console.log
    (
        BbsArticle
            .createQueryBuilder()
            .andWhere(...BbsArticle.getWhereArguments("parent", null!))
            .getSql()
    );
}

function test_complicate_join(): void
{
    BbsGroup.createJoinQueryBuilder(group => group
        .leftJoin("articles", article =>
        {
            article.leftJoin("cover").leftJoin("file");
            article.leftJoin("comments");
        }))
        .select([
            BbsArticleCover.getColumn("file")
        ])
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
        namingStrategy: new SnakeCaseStrategy(),
        entities: [`${__dirname}/models/**/*.${__filename.substr(-2)}`],
        // logging: true
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
    // validate_equality(rawGroups, output);
    await test_join();
    test_complicate_join();

    test_get_column();
    await test_insert_collection();

    await connection.close();
}
main();