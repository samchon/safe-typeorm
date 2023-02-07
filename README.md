# Safe-TypeORM
![logo](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/logo.png)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/safe-typeorm/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/safe-typeorm.svg)](https://www.npmjs.com/package/safe-typeorm)
[![Downloads](https://img.shields.io/npm/dm/safe-typeorm.svg)](https://www.npmjs.com/package/safe-typeorm)
[![Build Status](https://github.com/samchon/safe-typeorm/workflows/build/badge.svg)](https://github.com/samchon/safe-typeorm/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/safe-typeorm/wiki)

Make `anyorm` to be real `typeorm`.

`safe-typeorm` is a helper library of `typeorm`, enhancing type safety like below:

  - When writing [**SQL query**](https://github.com/samchon/safe-typeorm/wiki/Builders#joinquerybuilder),
    - Errors would be detected in the **compilation** level
    - **Auto Completion** would be provided
    - **Type Hint** would be supported
  - You can implement [**App-join**](https://github.com/samchon/safe-typeorm/wiki/Builders#appjoinbuilder) very conveniently
  - When [**SELECT**ing for **JSON** conversion](https://github.com/samchon/safe-typeorm/wiki/Builders#jsonselectbuilder)
    - [**App-Join**](https://github.com/samchon/safe-typeorm/wiki/Builders#appjoinbuilder) with the related entities would be automatically done
    - Exact JSON **type** would be automatically **deduced**
    - The **performance** would be **automatically tuned**

![JoinQueryBuilder](https://raw.githubusercontent.com/samchon/safe-typeorm/master/assets/demonstrations/join-query-builder.gif)




## Setup
```bash
npm install --save typeorm@0.2
npm install --save safe-typeorm
```

Just install through `npm install` command.

Note that, `safe-typeorm` supports only `typeorm` v0.2 yet.




## Features
About supported features, see [Guide Documents](https://github.com/samchon/safe-typeorm/wiki)

  - Relationships
    - [Preface](https://github.com/samchon/safe-typeorm/wiki/Relationships)
    - [Belongs.ManyToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#belongsmanytoone)
    - [Belongs.OneToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#belongsonetoone)
    - [Has.OneToOne](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasonetoone)
    - [Has.OneToMany](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasonetomany)
    - [Has.ManyToMany](https://github.com/samchon/safe-typeorm/wiki/Relationships#hasmanytomany)
  - Builders
    - [Preface](https://github.com/samchon/safe-typeorm/wiki/Builders)
    - [JoinQueryBuilder](https://github.com/samchon/safe-typeorm/wiki/Builders#joinquerybuilder)
    - [AppJoinBuilder](https://github.com/samchon/safe-typeorm/wiki/Builders#appjoinbuilder)
    - [JsonSelectBuilder](https://github.com/samchon/safe-typeorm/wiki/Builders#jsonselectbuilder)
  - Insertions
    - [initialize](https://github.com/samchon/safe-typeorm/wiki/Insertions#initialize)
    - [InsertCollection](https://github.com/samchon/safe-typeorm/wiki/Insertions#insertcollection)
    - [EntityUtil](https://github.com/samchon/safe-typeorm/wiki/Insertions#entityutil)
  - Utilities
    - [EncryptedColumn](https://github.com/samchon/safe-typeorm/wiki/Utilities#encryptedcolumn)
    - [Paginator](https://github.com/samchon/safe-typeorm/wiki/Utilities#paginator)
    - [Password](https://github.com/samchon/safe-typeorm/wiki/Utilities#password)
    - [SnakeCaseStrategy](https://github.com/samchon/safe-typeorm/wiki/Utilities#snakecasestrategy)




## Appendix
### Typia
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/typia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/typia.svg)](https://www.npmjs.com/package/typia)
[![Downloads](https://img.shields.io/npm/dm/typia.svg)](https://www.npmjs.com/package/typia)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/typia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/typia/wiki)

```typescript
// RUNTIME VALIDATORS
export function is<T>(input: unknown | T): input is T; // returns boolean
export function assert<T>(input: unknown | T): T; // throws TypeGuardError
export function validate<T>(input: unknown | T): IValidation<T>; // detailed

// STRICT VALIDATORS
export function equals<T>(input: unknown | T): input is T;
export function assertEquals<T>(input: unknown | T): T;
export function validateEquals<T>(input: unknown | T): IValidation<T>;

// JSON
export function application<T>(): IJsonApplication; // JSON schema
export function assertParse<T>(input: string): T; // type safe parser
export function assertStringify<T>(input: T): string; // safe and faster
    // +) isParse, validateParse 
    // +) stringify, isStringify, validateStringify
```

[Typia](https://github.com/samchon/typia) is a transformer library of TypeScript, supporting below features:

  - Super-fast Runtime Validators
  - Safe JSON parse and fast stringify functions
  - JSON schema generator

All functions in `typia` require **only one line**. You don't need any extra dedication like JSON schema definitions or decorator function calls. Just call `typia` function with only one line like `typia.assert<T>(input)`.

Also, as `typia` performs AOT (Ahead of Time) compilation skill, its performance is much faster than other competitive libaries. For an example, when comparing validate function `is()` with other competitive libraries, `typia` is maximum **15,000x times faster** than `class-validator`.

### Nestia
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/nestia/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Downloads](https://img.shields.io/npm/dm/@nestia/core.svg)](https://www.npmjs.com/package/@nestia/core)
[![Build Status](https://github.com/samchon/typia/workflows/build/badge.svg)](https://github.com/samchon/nestia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/nestia/wiki)

[Nestia](https://github.com/samchon/nestia) is a set of helper libraries for `NestJS`, supporting below features:

  - `@nestia/core`: **15,000x times faster** validation decorators
  - `@nestia/sdk`: evolved **SDK** and **Swagger** generators
    - SDK (Software Development Kit)
      - interaction library for client developers
      - almost same with [tRPC](https://github.com/trpc/trpc)
  - `nestia`: just CLI (command line interface) tool

![nestia-sdk-demo](https://user-images.githubusercontent.com/13158709/215004990-368c589d-7101-404e-b81b-fbc936382f05.gif)

### Reactia
> Not published yet, but soon

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/reactia/blob/master/LICENSE)
[![Build Status](https://github.com/samchon/reactia/workflows/build/badge.svg)](https://github.com/samchon/reactia/actions?query=workflow%3Abuild)
[![Guide Documents](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/samchon/reactia/wiki)

[Reactia](https://github.com/samchon/reactia) is an automatic React components generator, just by analyzing TypeScript type.

  - `@reactia/core`: Core Library analyzing TypeScript type
  - `@reactia/mui`: Material UI Theme for `core` and `nest`
  - `@reactia/nest`: Automatic Frontend Application Builder for `NestJS`

![Sample](https://user-images.githubusercontent.com/13158709/199074008-46b2dd67-02be-40b1-aa0f-74ac41f3e0a7.png)

When you want to automate an individual component, just use `@reactia/core`.

```tsx
import ReactDOM from "react-dom";

import typia from "typia";
import { ReactiaComponent } from "@reactia/core";
import { MuiInputTheme } from "@reactia/mui";

const RequestInput = ReactiaComponent<IRequestDto>(MuiInputTheme());
const input: IRequestDto = { ... };

ReactDOM.render(
    <RequestInput input={input} />,
    document.body
);
```

Otherwise, you can fully automate frontend application development through `@reactia/nest`.

```tsx
import React from "react";
import ReactDOM from "react-dom";

import { ISwagger } "@nestia/swagger";
import { MuiApplicationTheme } from "@reactia/mui";
import { ReactiaApplication } from "@reactia/nest";

// swagger.json must be generated by @nestia/sdk
const swagger: ISwagger = await import("./swagger.json");
const App: React.FC = ReactiaApplication(MuiApplicationTheme())(swagger);

ReactDOM.render(
    <App />,
    document.body
);
```