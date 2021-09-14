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

  - When writing SQL query,
    - Errors would be detected in the **compilation** level
    - **Auto Completion** would be provided
    - **Type Hint** would be supported
  - You can implement **App-join** very conveniently, and its code is same with the DB join
  - When **SELECT**ing for **JSON** conversion, the **performance** would be **automatically tuned**
  - When **INSERT**ing records, the **performance** would be **automatically tuned**

If you write any SQL query through the `safe-typeorm`, the error would be detected in the compilation level. Also, when you're writing any SQL query, `safe-typeorm` would help you by hinting through the auto-completion.

Also, if you've defined your ORM model classes using this `safe-typeorm`, you can implement the application level joining very conveniently. Even the code implementing the application level joining is similar with the database level joining. Therefore, you can convert from DB join to App join witout cost and opposite case is same, too.

Furthermore, `safe-typeorm` supports the json conversion very strongly. After you write down the conversion code from ORM model class instances to JSON data, `safe-typeorm` would find optimal joining solution by itself. Therefore, you don't need to consider the performance issue. Just concentrate on your business logic.




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
export async function test_json_select_builder(models: BbsGroup): Promise<void>
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