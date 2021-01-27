import * as orm from "typeorm";

import { Belongs } from "./Belongs";
import { Has } from "./Has";

import { CreatorType } from "./typings/CreatorType";
import { SpecialFields } from "./typings/SpecialFields";

export abstract class Model extends orm.BaseEntity
{
    public abstract get id(): number;

    /**
     * Update current entity data to the database.
     * 
     * If the primary key field {@link id} is not {@link IncrementalColumn auto incremental}, the 
     * TypeORM can't distinguish whether a {@link Model} instance is newly created or updated from
     * ordinary. Therefore, when call {@link save} method in a {@link Model} instance whose 
     * {@link id} field is not {@link IncrementalColumn auto incremental}, the TypeORM always 
     * execute the `INSERT` query instead of `UPDATE` statement.
     * 
     * Therefore, when the {@link id} fields is not {@link IncrementalColumn auto incremental}, you
     * have to distinguish `INSERT` and `UPDATE` queries by calling one of the {@link save} and 
     * {@link update} method by yourself.
     */
    public async update(): Promise<void>
    {
        const columnList = orm.getRepository(this.constructor).metadata.columns;
        const props: any = {};
        
        for (const column of columnList)
        {
            const key: string = column.propertyName;
            props[key] = (this as any)[key];
        }
        await orm.getRepository(this.constructor).update(this.id, props);
    }

    public static getColumn<T extends Model>
        (
            this: CreatorType<T>, 
            field: SpecialFields<T, number | string | boolean | Date | Belongs.ManyToOne<any> | Belongs.OneToOne<any>>,
            alias?: string
        ): string
    {
        const fieldName: string = Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, this.prototype)
            ? Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:field`, this.prototype)
            : field as string;
        const ret: string = `${this.name}.${fieldName}`;

        return (alias !== undefined)
            ? `${ret} AS ${alias}`
            : ret;
    }

    public static join<T extends Model, Field extends SpecialFields<T, Model.RelationshipType<any>>>
        (
            this: Model.CreatorType<T>,
            stmt: orm.SelectQueryBuilder<any>,
            type: "inner" | "left",
            field: Field,
        ): Model.CreatorType<Model.TargetType<T, Field>>
    {
        type Target = Model.TargetType<T, Field>;

        let target: Model.CreatorType<Target>;
        let myField: string;
        let targetField: string;

        if (Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, this.prototype))
        {
            target = Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:target`, this.prototype)();
            myField = Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:field`, this.prototype);
            targetField = "id";
        }
        else
        {
            myField = "id";
            target = Reflect.getMetadata(`SafeTypeORM:Has:${field}:target`, this.prototype)();

            const inverseField: string = Reflect.getMetadata(`SafeTypeORM:Has:${field}:inverse`, this.prototype);
            targetField = Reflect.getMetadata(`SafeTypeORM:Belongs:${inverseField}:field`, target.prototype);
        }

        const tuple: [Model.CreatorType<Target>, string, string] = [target, target.name, `${this.name}.${myField} = ${target.name}.${targetField}`];
        if (type === "inner")
            stmt.innerJoin(...tuple);
        else
            stmt.leftJoin(...tuple);

        return target;
    }

    public static joinAndSelect<T extends Model, Field extends SpecialFields<T, Model.RelationshipType<any>>>
        (
            this: Model.CreatorType<T>,
            stmt: orm.SelectQueryBuilder<any>,
            type: "inner" | "left",
            field: Field,
        ): Model.CreatorType<Model.TargetType<T, Field>>
    {
        const target: Model.CreatorType<Model.TargetType<T, Field>> = Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, this.prototype)
            ? Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:target`, this.prototype)()
            : Reflect.getMetadata(`SafeTypeORM:Has:${field}:target`, this.prototype)();

        const tuple: [string, string] = [`${this.name}.${field}_getter`, target.name];
        if (type === "inner")
            stmt.innerJoinAndSelect(...tuple);
        else
            stmt.leftJoinAndSelect(...tuple);
        return target;
    }
}

export namespace Model
{
    export type CreatorType<T extends Model> = 
    {
        new(...args: any[]): T;
    } & typeof Model;

    export type TargetType<T extends Model, Field extends SpecialFields<T, RelationshipType<any>>>
        = T[Field] extends Belongs.ManyToOne<infer Target, any> ? Target
        : T[Field] extends Belongs.OneToOne<infer Target, any> ? Target
        : T[Field] extends Has.OneToOne<infer Target> ? Target
        : T[Field] extends Has.OneToMany<infer Target> ? Target
        : never;

    export type RelationshipType<T extends Model> = Belongs.ManyToOne<T> | Belongs.OneToOne<T> | Has.OneToOne<T> | Has.OneToMany<T>;
}