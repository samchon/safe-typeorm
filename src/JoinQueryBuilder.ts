import * as orm from "typeorm";
import { Belongs } from "./decorators/Belongs";
import { Has } from "./decorators/Has";

import { CreatorType } from "./typings/CreatorType";
import { RelationshipType } from "./typings/RelationshipType";
import { SpecialFields } from "./typings/SpecialFields";
import { TargetType } from "./typings/TargetType";

export class JoinQueryBuilder<Mine extends object>
{
    private readonly stmt_: orm.SelectQueryBuilder<any>;
    private readonly mine_: CreatorType<Mine>;
    private readonly alias_: string;

    public constructor(stmt: orm.SelectQueryBuilder<any>, mine: CreatorType<Mine>, alias?: string)
    {
        this.stmt_ = stmt;
        this.mine_ = mine;
        this.alias_ = (alias === undefined)
            ? mine.name
            : alias;
    }

    /* -----------------------------------------------------------
        RAW JOIN
    ----------------------------------------------------------- */
    public innerJoin<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field, 
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>;

    public innerJoin<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field, 
            alias: string,
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>;

    public innerJoin<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field, 
            alias?: string | ((builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void),
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        return this._Join
        (
            (target, alias, condition) => this.stmt_.innerJoin(target, alias, condition),
            field,
            ...get_parametric_tuple(alias, closure)
        );
    }

    public leftJoin<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>;

    public leftJoin<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            alias: string,
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>;

    public leftJoin<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            alias?: string | ((builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void),
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        return this._Join
        (
            (target, alias, condition) => this.stmt_.leftJoin(target, alias, condition),
            field,
            ...get_parametric_tuple(alias, closure)
        );
    }

    private _Join<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            joiner: (target: CreatorType<TargetType<Mine, Field>>, alias: string, condition: string) => orm.SelectQueryBuilder<any>,
            field: Field,
            alias: string | undefined,
            closure: ((builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void) | undefined
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        // PREPRAE ASSET
        const asset: IAsset<Mine, Field> = prepare_asset(this.mine_, field, alias);

        // LIST UP EACH FIELDS
        let myField: string;
        let targetField: string;

        if (asset.belongs === true)
        {
            // WHEN BELONGS TO PARENT
            myField = Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:field`, this.mine_.prototype);
            targetField = "id";
        }
        else
        {
            // WHEN HAS CHILDREN
            const inverseField: string = Reflect.getMetadata(`SafeTypeORM:Has:${field}:inverse`, this.mine_.prototype);
            targetField = Reflect.getMetadata(`SafeTypeORM:Belongs:${inverseField}:field`, asset.target.prototype);
            myField = "id";
        }

        // DO JOIN
        const condition: string = `${this.alias_}.${myField} = ${asset.alias}.${targetField}`;
        joiner(asset.target, asset.alias, condition);

        // CALL-BACK
        return call_back(this.stmt_, asset.target, asset.alias, closure);
    }

    /* -----------------------------------------------------------
        ORM JOIN
    ----------------------------------------------------------- */
    public innerJoinAndSelect<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>;

    public innerJoinAndSelect<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            alias: string,
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>;

    public innerJoinAndSelect<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            alias?: string | ((builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void),
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        return this._Join_and_select
        (
            (field, alias) => this.stmt_.innerJoinAndSelect(field, alias),
            field,
            ...get_parametric_tuple(alias, closure)
        );
    }

    public leftJoinAndSelect<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>;

    public leftJoinAndSelect<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            alias: string,
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>;

    public leftJoinAndSelect<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field,
            alias?: string | ((builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void),
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        return this._Join_and_select
        (
            (field, alias) => this.stmt_.leftJoinAndSelect(field, alias), 
            field, 
            ...get_parametric_tuple(alias, closure)
        );
    }

    private _Join_and_select<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            joiner: (field: string, alias: string) => orm.SelectQueryBuilder<any>,
            field: Field,
            alias: string | undefined,
            closure: ((builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void) | undefined
        )
    {
        // PREPARE ASSET
        const asset: IAsset<Mine, Field> = prepare_asset(this.mine_, field, alias);
        const index: string = (asset.belongs === true)
            ? Belongs.getGetterField<any>(field)
            : Has.getGetterField(field);

        // DO JOIN
        joiner(`${this.alias_}.${index}`, asset.alias);

        // CALL-BACK
        return call_back(this.stmt_, asset.target, asset.alias, closure);
    }
}

/* -----------------------------------------------------------
    BACKGROUND
----------------------------------------------------------- */
interface IAsset<
        Mine extends object, 
        Field extends SpecialFields<Mine, RelationshipType<any>>>
{
    target: CreatorType<TargetType<Mine, Field>>;
    alias: string;
    belongs: boolean;
}

function prepare_asset<
        Mine extends object, 
        Field extends SpecialFields<Mine, RelationshipType<any>>>
    (
        mine: CreatorType<Mine>,
        field: Field,
        alias: string | undefined
    ): IAsset<Mine, Field>
{
    // FIND TARGET
    const belongs: boolean = Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, mine.prototype);
    const target: CreatorType<TargetType<Mine, Field>> = (belongs === true)
        ? Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:target`, mine.prototype)()
        : Reflect.getMetadata(`SafeTypeORM:Has:${field}:target`, mine.prototype)();

    // DETERMINE THE ALIAS
    if (alias === undefined)
        alias = target.name;
    
    // RETURNS
    return { target, alias, belongs };
}

function call_back<Target extends object>
    (
        stmt: orm.SelectQueryBuilder<any>, 
        target: CreatorType<Target>, 
        alias: string,
        closure: ((builder: JoinQueryBuilder<Target>) => void) | undefined
    ): JoinQueryBuilder<Target>
{
    const ret: JoinQueryBuilder<Target> = new JoinQueryBuilder(stmt, target, alias);
    if (closure !== undefined)
        closure(ret);
    return ret;
}

function get_parametric_tuple<Func extends Function>
    (x?: string | Func, y?: Func): [string|undefined, Func|undefined]
{
    return (typeof x === "string")
        ? [x, y]
        : [undefined, x];
}