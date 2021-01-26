import * as orm from "typeorm";
import { InvalidArgument } from "tstl/exception/InvalidArgument";

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
            field: SpecialFields<T, number | string | boolean | Date | Belongs.ManyToOne<any> | Belongs.OneToOne<any>>
        ): string
    {
        const fieldName: string = Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, this.prototype)
            ? Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:field`, this.prototype)
            : field as string;
        return `${getTable(this)}.${fieldName}`;
    }

    public static getJoinArguments<T extends Model, Target extends Model>
        (
            this: CreatorType<T>,
            field: SpecialFields<T, Belongs.ManyToOne<Target> | Has.OneToMany<Target>>
        ): [CreatorType<Target>, string]
    {
        let target: CreatorType<Target>;
        let targetField: string;
        let myField: string;

        if (Reflect.hasMetadata(`SafeTypeORM:Belongs:${field}`, this.prototype))
        {
            target = Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:target`, this.prototype)();
            targetField = "id";
            myField = Reflect.getMetadata(`SafeTypeORM:Belongs:${field}:field`, this.prototype);
        }
        else if (Reflect.hasMetadata(`SafeTypeORM:Has:${field}:target`, this.prototype))
        {
            target = Reflect.getMetadata(`SafeTypeORM:Has:${field}:target`, this.prototype)();
            targetField = Reflect.getMetadata(`SafeTypeORM:Has:${field}:inverse`, this.prototype);
            myField = "id";
        }
        else
            throw new InvalidArgument(`Error on ${this.constructor.name}.getJoinArguments("${field}"): target field is not a type of the Belongs or Has relationship.`);

        return [target, `${getTable(this)}.${myField} = ${getTable(target)}.${targetField}`];
    }
}

function getTable<T extends Model>(creator: CreatorType<T>): string
{
    return orm.getRepository(creator).metadata.tableName;
}