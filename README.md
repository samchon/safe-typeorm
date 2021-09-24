# Safe-TypeORM
![logo](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/logo.png)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/safe-typeorm/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/safe-typeorm.svg)](https://www.npmjs.com/package/safe-typeorm)
[![Downloads](https://img.shields.io/npm/dm/safe-typeorm.svg)](https://www.npmjs.com/package/safe-typeorm)
[![Build Status](https://github.com/samchon/safe-typeorm/workflows/build/badge.svg)](https://github.com/samchon/safe-typeorm/actions?query=workflow%3Abuild)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fsamchon%2Fsafe-typeorm.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fsamchon%2Fsafe-typeorm?ref=badge_shield)
[![Chat on Gitter](https://badges.gitter.im/samchon/safe-typeorm.svg)](https://gitter.im/samchon/safe-typeorm?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

```bash
npm install --save safe-typeorm
```

The `safe-typeorm` is a helper library for [typeorm](https://github.com/typeorm/typeorm), enhancing safety in the compilation level.

  - When writing [**SQL query**](#safe-query-builder),
    - Errors would be detected in the **compilation** level
    - **Auto Completion** would be provided
    - **Type Hint** would be supported
  - You can implement [**App-join**](#app-join-builder) very conveniently
  - When [**SELECT**ing for **JSON** conversion](#json-select-builder)
    - [**App-Join**](#app-join-builder) with the related entities would be automatically done
    - Exact JSON **type** would be automatically **deduced**
    - The **performance** would be **automatically tuned**
  - When [**INSERT**](#insert-collection)ing records
    - Sequence of tables would be automatically sorted by analyzing dependencies
    - The **performance** would be **automatically tuned**




## Demonstration
### ORM Model Classes
![Entity Relationship Diagram](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/designs/entity-relationship-diagram.png)

For demonstration, I've taken ORM model classes from the *Test Automation Program* of this `safe-typeorm`. The ORM model classes in the *Test Automation Program* represents a BBS (built-in bullet system) and its ERD (Entity Relationship Diagram) is like upper image.

Also, below is the list of ORM model classes used in the Test Automation Program. If you want to see the detailed code of the ORM model classes, click the below link. Traveling the ORM model classes, you would understand how to define the ORM model classes and their relationships through this `safe-typeorm`.

  - [**src/test/models**](https://github.com/samchon/safe-typeorm/tree/master/src/test/models)
    - Sections
      - [`BbsCategory`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsCategory.ts): To demonstrate the recursive 1: N relationship
      - [`BbsGroup`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsGroup.ts)
    - Articles
      - [`BbsArticle`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsArticle.ts): To demonstrate lots of relationships
      - [`BbsReviewArticle`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsReviewArticle.ts): To demonstrate super & sub type definition
      - [`BbsQuestionArticle`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsQuestionArticle.ts)
      - [`BbsAnswerArticle`](https://github.com/samchon/safe-typeorm/blob/master/src/test/BbsAnswerArticlemodels/.ts)
      - [`BbsArticleTag`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsArticleTag.ts): To demonstrate `JsonSelectBuilder.Output.Mapper`
      - [`BbsArticleContent`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsArticleContent.ts): To demonstrate M: N relationship
      - [`BbsArticleContentFilePair`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsArticleContentFilePair.ts): To resolve the M: N relatioship
    - Comments
      - [`BbsComment`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsComment.ts): To demonstrate M: N relationship
      - [`BbsCommentFilePair`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/BbsCommentFilePair.ts): To resolve the M: N relatioship
    - Miscellaneous
      - [`AttachmentFile`](https://github.com/samchon/safe-typeorm/blob/master/src/test/models/AttachmentFile.ts)

### Safe Query Builder
![Safe Query Builder](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/demonstrations/safe-query-builder.gif)

In `safe-typeorm`, you can write SQL query much safely and conveniently. 

If you take a mistake when writing an SQL query, the error would be occured in the compilation level. Therefore, you don't need to suffer by runtime error by mistaken SQL query. Also, if you're writing wrong SQL query, the IDE (like VSCode) will warn you with the red underlined emphasizing, to tell you there can be an SQL error.

Also, `safe-typeorm` supports type hinting with auto-completion when you're writing the SQL query. Therefore, you can write SQL query much faster than before. Of course, the fast-written SQL query would be ensured its safety by the compiler and IDE.

```typescript
export async function test_safe_query_builder(): Promise<void>
{
    const group: BbsGroup = await BbsGroup.findOneOrFail();
    const category: BbsCategory = await BbsCategory.findOneOrFail();

    const stmt: orm.SelectQueryBuilder<BbsQuestionArticle> = safe
        .createJoinQueryBuilder(BbsQuestionArticle, question =>
        {
            question.innerJoin("base", article =>
            {
                article.innerJoin("group");
                article.innerJoin("category");
                article.innerJoin("__mv_last").innerJoin("content");
            });
            question.leftJoin("answer")
                .leftJoin("base", "AA")
                .leftJoin("__mv_last", "AL")
                .leftJoin("content", "AC");
        })
        .andWhere(...BbsArticle.getWhereArguments("group", group))
        .andWhere(...BbsCategory.getWhereArguments("code", "!=", category.code))
        .select([
            BbsArticle.getColumn("id"),
            BbsGroup.getColumn("name", "group"),
            BbsCategory.getColumn("name", "category"),
            BbsArticle.getColumn("writer"),
            BbsArticleContent.getColumn("title"),
            BbsArticle.getColumn("created_at"),
            BbsArticleContent.getColumn("created_at", "updated_at"),

            BbsArticle.getColumn("AA.writer", "answer_writer"),
            BbsArticleContent.getColumn("AA.title", "answer_title"),
            BbsArticle.getColumn("AA.created_at", "answer_created_at"),
        ]);
    stmt;
}
```

### App Join Builder
With the `AppJoinBuilder` class, you can implement application level joining very easily. 

Also, grammer of the `AppJoinBuilder` is exactly same with the `JoinQueryBuilder`. Therefore, you can swap `JoinQueryBuilder` and `AppJoinBuilder` very simply without any cost. Thus, you can just select one of them suitable for your case.

```typescript
export async function test_app_join_builder(): Promise<void>
{
    const builder: safe.AppJoinBuilder<BbsGroup> = safe
        .createAppJoinBuilder(BbsGroup, group =>
        {
            group.join("articles", article =>
            {
                article.join("category");
                article.join("contents").join("files");
                article.join("comments").join("files");
            });
        });
}
```

Furthermore, you've determined to using only the `AppJoinBuilder`, you can configure it much safely. With the `AppJoinBuilder.initialize()` method, you've configure all of the relationship accessors, and it prevents any type of ommission by your mistake.

```typescript
export async function test_app_join_builder_initialize(): Promise<void>
{
    const builder = safe.AppJoinBuilder.initialize(BbsGroup, {
        articles: safe.AppJoinBuilder.initialize(BbsArticle, {
            group: undefined,
            review: safe.AppJoinBuilder.initialize(BbsReviewArticle, {
                base: undefined,
            }),
            category: safe.AppJoinBuilder.initialize(BbsCategory, {
                articles: undefined,
                children: undefined,
                parent: "recursive"
            }),
            contents: safe.AppJoinBuilder.initialize(BbsArticleContent, {
                article: undefined,
                files: "join"
            }),
            comments: safe.AppJoinBuilder.initialize(BbsComment, {
                article: undefined,
                files: "join"
            }),
            tags: "join",
            __mv_last: undefined,
            question: undefined,
            answer: undefined,
        })
    });
}
```

### JSON Select Builder
![Class Diagram](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/designs/class-diagram.png)

In `safe-typeorm`, when you want to load DB records and convert them to a **JSON** data, you don't need to write any `SELECT` or `JOIN` query. You also do not need to consider any performance tuning. Just write down the `ORM -> JSON` conversion plan, then `safe-typeorm` will do everything.

The `JsonSelectBuilder` is the class doing everything. It will analyze your **JSON** conversion plan, and compose the **JSON** conversion method automatically with the exact **JSON** type what you want. Furthermore, the `JsonSelectBuilder` finds the best (applicataion level) joining plan by itself, when being constructed.

Below code is an example converting ORM model class instances to JSON data with the `JsonSelectBuilder`. As you can see, there's no special script in the below code, but only the conversion plan is. As I've mentioned, `JsonSelectBuilder` will construct the exact **JSON** type by analyzing your conversion plan. Also, the performance tuning would be done automatically. 

Therefore, just enjoy the `JsonSelectBuilder` without any worry.

```typescript
export async function test_json_select_builder(models: BbsGroup[]): Promise<void>
{
    const builder = safe.createJsonSelectBuilder(BbsGroup, 
    {
        articles: safe.createJsonSelectBuilder(BbsArticle, 
        {
            group: safe.DEFAULT,
            category: safe.createJsonSelectBuilder(BbsCategory, 
            { 
                parent: "recursive",
                children: undefined, // INVERSE
                articles: undefined, // INVERSE
            }),
            tags: safe.createJsonSelectBuilder
            (
                BbsArticleTag, 
                { article: undefined }, 
                tag => tag.value // OUTPUT CONVERSION BY MAPPING
            ),
            contents: safe.createJsonSelectBuilder(BbsArticleContent, 
            {
                article: undefined, // INVERSE
                files: safe.createJsonSelectBuilder(AttachmentFile, {})
            }),
            review: undefined, // SUB-TYPE
            question: undefined, // SUB-TYPE
            answer: undefined, // SUB-TYPE
            comments: undefined, // ONE-TO-MAY
        })
    });

    // GET JSON DATA FROM THE BUILDER
    const raw = await builder.getMany(models);

    // THE RETURN TYPE IS ALWAYS EXACT
    // THEREFORE, TYPEOF "RAW" AND "I-BBS-GROUP" ARE EXACTLY SAME
    const regular: IBbsGroup[] = raw;
    const inverse: typeof raw = regular;
}
```

  - [**src/test/structures**](https://github.com/samchon/safe-typeorm/tree/master/src/test/structures)
    - [IBbsGroup](https://github.com/samchon/safe-typeorm/tree/master/src/test/structures/IBbsGroup.ts)
    - [IBbsCategory](https://github.com/samchon/safe-typeorm/tree/master/src/test/structures/IBbsCategory.ts)
    - [IBbsArticle](https://github.com/samchon/safe-typeorm/tree/master/src/test/structures/IBbsArticle.ts)
    - [IBbsArticleContent](https://github.com/samchon/safe-typeorm/tree/master/src/test/structures/IBbsArticleContent.ts)
    - [IBbsComment](https://github.com/samchon/safe-typeorm/tree/master/src/test/structures/IBbsComment.ts)

### Insert Collection
When you want to execute `INSERT` query for lots of records of plural tables, you've to consider dependency relationships. Also, you may construct extended SQL query manually by yourself, if you're interested in the performance tuning.

However, with the `InsertCollection` class provided by this `safe-typeorm`, you don't need to consider any dependcy relationship. You also do not need to consider any performance tuning. The `InsertCollection` will analyze the dependency relationships and orders the insertion sequence automatically. Also, the `InsertCollection` utilizes the extended insertion query for the optimizing performance.

```typescript
export async function archive
    (
        comments: BbsComment[],
        questions: BbsQuestionArticle[],
        reviews: BbsArticleReview[],
        groups: BbsGroup[],
        files: AttachmentFile[],
        answers: BbsAnswerArticle[],
        categories: BbsCategory[],
        comments: BbsComment[],
        articles: BbsArticle[],
        contents: BbsArticleContent[],
        tags: BbsArticleTag[],
    ): Promise<void>
{
    const collection: safe.InsertCollection = new safe.InsertCollection();

    collection.push(comments);
    collection.push(questions);
    collection.push(reviews);
    collection.push(groups);
    collection.push(files);
    collection.push(answers);

    for (const category of categories)
        collection.push(category);

    collection.push(comments);
    collection.push(articles);
    collection.push(contents);
    collection.push(tags);

    await collection.execute();
}
```




## Appendix
### TypeORM
[typeorm#8184](https://github.com/typeorm/typeorm/issues/8184)

I've awaited next version of the `typeorm` for many years, and I can't wait no more.

So I've decided to implement the next version by myself. I'd wanted to contribute to this `typeorm` after the next version implementation has been completed, but it was not possible by critical change on the relationship definition like `Has.OneToMany` or `Belongs.ManyToOne`. Therefore, I've published the next version as a helper library of the`typeorm`.

I dedicate this `safe-typeorm` to the `typeorm`. If developers of the `typeorm` accept the critical change on the relationship definition, it would be the next version of the `typeorm`. Otherwise they reject, this `safe-typeorm` would be left as a helper library like now.

### Nestia
https://github.com/samchon/nestia

[nestia](https://github.com/samchon/nestia) is another library what I've developed, automatic SDK generator for the NestJS backend server. With those `safe-typeorm` and [nestia](https://github.com/samchon/nestia), you can reduce lots of costs and time for developing the backend server.

When you're developing a backend server using the `NestJS`, you don't need any extra dedication, for delivering the Rest API to the client developers, like writing the `swagger` comments. You just run the [nestia](https://github.com/samchon/nestia) up, then [nestia](https://github.com/samchon/nestia) would generate the SDK automatically, by analyzing your controller classes in the compliation and runtime level.

With the automatically generated SDK through the [nestia](https://github.com/samchon/nestia), client developer also does not need any extra work, like reading `swagger` and writing the duplicated interaction code. Client developer only needs to import the SDK and calls matched function with the `await` symbol.

```typescript
import api from "@samchon/bbs-api";
import { IBbsArticle } from "@samchon/bbs-api/lib/structures/bbs/IBbsArticle";
import { IPage } from "@samchon/bbs-api/lib/structures/common/IPage";

export async function test_article_read(connection: api.IConnection): Promise<void>
{
    // LIST UP ARTICLE SUMMARIES
    const index: IPage<IBbsArticle.ISummary> = await api.functional.bbs.articles.index
    (
        connection,
        "free",
        { limit: 100, page: 1 }
    );

    // READ AN ARTICLE DETAILY
    const article: IBbsArticle = await api.functional.bbs.articles.at
    (
        connection,
        "free",
        index.data[0].id
    );
    console.log(article.title, aritlce.body, article.files);
}
```

### Technial Support
samchon.github@gmail.com

I can provide technical support about those `safe-typeorm` and [nestia](https://github.com/samchon/nestia).

Therefore, if you have any question or need help, feel free to contact me. If you want to adapt those `safe-typeorm` and [nestia](https://github.com/samchon/nestia) in your commercial project, I can provide you the best guidance. 

I also can help your backend project in the entire development level. If you're suffering by DB architecture design or API structure design, just contact me and get help. I'll help you with my best effort.

### Archidraw
https://www.archisketch.com/

I have special thanks to the Archidraw, where I'm working for.

The Archidraw is a great IT company developing 3D interior editor and lots of solutions based on the 3D assets. Also, the Archidraw is the first company who had adopted `safe-typeorm` on their commercial backend project, even `safe-typeorm` was in the alpha level.