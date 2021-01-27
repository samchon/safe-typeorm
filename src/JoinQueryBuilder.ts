import * as orm from "typeorm";

import { Model } from "./Model";
import { CreatorType } from "./typings/CreatorType";
import { RelationshipType } from "./typings/RelationshipType";

import { SpecialFields } from "./typings/SpecialFields";
import { TargetType } from "./typings/TargetType";

export class JoinQueryBuilder<Mine extends Model>
{
    private readonly stmt_: orm.SelectQueryBuilder<any>;
    private readonly mine_: CreatorType<Mine>;

    public constructor(stmt: orm.SelectQueryBuilder<any>, mine: CreatorType<Mine>)
    {
        this.stmt_ = stmt;
        this.mine_ = mine;
    }

    /* -----------------------------------------------------------
        RAW JOIN
    ----------------------------------------------------------- */
    public innerJoin<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field, 
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        return this._Join
        (
            (target, alias, condition) => this.stmt_.innerJoin(target, alias, condition),
            field,
            closure
        );
    }

    public leftJoin<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field, 
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        return this._Join
        (
            (target, alias, condition) => this.stmt_.leftJoin(target, alias, condition),
            field,
            closure
        );
    }

    private _Join<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            joiner: (target: CreatorType<TargetType<Mine, Field>>, alias: string, condition: string) => orm.SelectQueryBuilder<any>,
            field: Field,
            closure: ((builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void) | undefined
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        //----
        // PREPARE ASSETS
        //----
        // GET TARGET CLASS WITH TYPE OF THE RELATIONSHIP
        const belongs: boolean = is_belongs<Mine, Field>(this.mine_, field);
        const target: CreatorType<TargetType<Mine, Field>> = get_target_creator(this.mine_, field, belongs);

        // LIST UP EACH FIELDS
        let myField: string;
        let targetField: string;

        if (belongs === true)
        {
            // WHEN BELONGS TO PARENT
            myField = Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:field`, this.mine_.prototype);
            targetField = "id";
        }
        else
        {
            // WHEN HAS CHILDREN
            const inverseField: string = Reflect.getMetadata(`SafeTypeORM:Has:${field}:inverse`, this.mine_.prototype);
            targetField = Reflect.getMetadata(`SafeTypeORM:Belongs:${inverseField}:field`, target.prototype);
            myField = "id";
        }

        // DO JOIN
        const condition: string = `${this.mine_.name}.${myField} = ${target.name}.${targetField}`;
        joiner(target, target.name, condition);

        // CALL-BACK
        return call_back(this.stmt_, target, closure);
    }

    /* -----------------------------------------------------------
        ORM JOIN
    ----------------------------------------------------------- */
    public innerJoinAndSelect<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field, 
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        return this._Join_and_select
        (
            (field, alias) => this.stmt_.innerJoinAndSelect(field, alias),
            field, 
            closure
        );
    }

    public leftJoinAndSelect<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            field: Field, 
            closure?: (builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void
        ): JoinQueryBuilder<TargetType<Mine, Field>>
    {
        return this._Join_and_select
        (
            (field, alias) => this.stmt_.leftJoinAndSelect(field, alias), 
            field, 
            closure
        );
    }

    private _Join_and_select<Field extends SpecialFields<Mine, RelationshipType<any>>>
        (
            joiner: (field: string, alias: string) => orm.SelectQueryBuilder<any>,
            field: Field,
            closure: ((builder: JoinQueryBuilder<TargetType<Mine, Field>>) => void) | undefined
        )
    {
        // GET TARGET CLASS
        const target: CreatorType<TargetType<Mine, Field>> = get_target_creator<Mine, Field>(this.mine_, field);

        // DO JOIN
        joiner(`${this.mine_.name}.${field}_getter`, target.name);

        // CALL-BACK
        return call_back(this.stmt_, target, closure);
    }
}

/* -----------------------------------------------------------
    BACKGROUND
----------------------------------------------------------- */
function call_back<Target extends Model>
    (stmt: orm.SelectQueryBuilder<any>, target: CreatorType<Target>, closure: ((builder: JoinQueryBuilder<Target>) => void) | undefined): JoinQueryBuilder<Target>
{
    const ret: JoinQueryBuilder<Target> = new JoinQueryBuilder(stmt, target);
    if (closure !== undefined)
        closure(ret);
    return ret;
}

function is_belongs<
        Mine extends Model, 
        Field extends SpecialFields<Mine, RelationshipType<any>>>
    (mine: CreatorType<Model>, field: Field): boolean
{
    return Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, mine.prototype);
}

function get_target_creator<
        Mine extends Model, 
        Field extends SpecialFields<Mine, RelationshipType<any>>>
    (
        mine: CreatorType<Model>, 
        field: Field, 
        belongs: boolean = is_belongs<Mine, Field>(mine, field)
    ): CreatorType<TargetType<Mine, Field>>
{
    return belongs === true
        ? Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:target`, mine.prototype)()
        : Reflect.getMetadata(`SafeTypeORM:Has:${field}:target`, mine.prototype)();
}