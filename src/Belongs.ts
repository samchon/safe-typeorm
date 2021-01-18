import * as orm from "typeorm";

import { IEntity } from "./internal/IEntity";
import { CapsuleNullable } from "./typings/CapsuleNullable";
import { CreatorType } from "./typings/CreatorType";

export namespace Belongs
{
    export type ManyToOne<Target extends IEntity, Options extends Partial<ManyToOne.IOptions> = {}> = Helper<Target, Options>;
    export function ManyToOne<Target extends IEntity, Options extends Partial<ManyToOne.IOptions>>
        (targetGen: TypeGenerator<Target>, field: string, options?: Options): PropertyDecorator
    {
        return _Belongs_to(orm.ManyToOne, targetGen, field, options);
    }
    export namespace ManyToOne
    {
        export interface IOptions
        {
            index: boolean;
            nullable: boolean;
        }
    }

    export type OneToOne<Target extends IEntity, Options extends Partial<OneToOne.IOptions> = {}> = Helper<Target, Options>;
    export function OneToOne<Target extends IEntity, Options extends Partial<OneToOne.IOptions>>
        (targetGen: TypeGenerator<Target>, field: string, options?: Options): PropertyDecorator
    {
        return _Belongs_to(orm.OneToOne, targetGen, field, options);
    }
    export namespace OneToOne
    {
        export interface IOptions extends ManyToOne.IOptions
        {
            unique: boolean;
            primary: boolean;
        }
    }

    class Helper<Target extends IEntity, Options extends Partial<ManyToOne.IOptions>>
    {
        private readonly target_: CreatorType<Target>;
        private readonly source_: any;
        private readonly getter_: string;
        private readonly field_: string;
        private changed_: boolean;

        public constructor(target: CreatorType<Target>, source: ManyToOne.IOptions, property: string, field: string)
        {
            this.target_ = target;
            this.source_ = source;
            this.getter_ = `${property}_getter`;
            this.field_ = field;
            this.changed_ = false;
        }

        public get id(): CapsuleNullable<number, Options>
        {
            return this.source_[this.field_];
        }
        public set id(value: CapsuleNullable<number, Options>)
        {
            const previous: number | null = this.source_[this.field_];
            this.source_[this.field_] = value;

            if (previous !== value)
            {
                delete this.source_[`__${this.getter_}__`];
                delete this.source_[`__has_${this.getter_}__`];
                this.changed_ = true;
            }
        }

        public async get(): Promise<CapsuleNullable<Target, Options>>
        {
            const id: number | null = this.id;
            if (id === null)
                return null!;

            if (this.changed_ === true)
            {
                const loaded: Target | undefined = await orm.getRepository(this.target_).findOne(this.id!);
                this.source_[this.getter_] = Promise.resolve(loaded ? loaded : null);

                this.changed_ = true;
            }
            return await this.source_[this.getter_];
        }

        public set(obj: CapsuleNullable<Target, Options>): void
        {
            this.changed_ = false;
            this.source_[this.field_] = (obj !== null) ? obj.id : null!;
            this.source_[this.getter_] = Promise.resolve(obj);
        }

        public statement(alias: string): orm.QueryBuilder<Target>
        {
            return orm.getRepository(this.target_)
                .createQueryBuilder(alias)
                .andWhere(`${alias}.id = :id`, { id: this.id });
        }
    }

    function _Belongs_to<Target extends IEntity, Options extends object>
        (
            relation: typeof orm.ManyToOne | typeof orm.OneToOne,
            targetGen: () => CreatorType<Target>,
            field: string,
            options?: Options
        ): PropertyDecorator
    {
        if (options === undefined)
            options = {} as Options;

        return function ($class, $property)
        {
            Reflect.defineMetadata(`SafeTypeORM:Belongs:field:${$property as string}`, $property, $class);
            const getter: string = `${$property as string}_getter`;
            const label: string = `${$property as string}_helper`;

            orm.Column("int", { ...options, unsigned: true })($class, field);
            relation(targetGen, { ...options, lazy: true })($class, getter);
            orm.JoinColumn({ name: field })($class, getter);

            Object.defineProperty($class, $property,
            {
                get: function (): Helper<Target, Options>
                {
                    if (this[label] === undefined)
                        this[label] = new Helper(targetGen(), this, $property as string, field);
                    return this[label];
                }
            });
        };
    }

    type TypeGenerator<Entity extends IEntity> = () => CreatorType<Entity>;
}