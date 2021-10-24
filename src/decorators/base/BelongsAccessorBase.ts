import { CapsuleNullable } from "../../typings/CapsuleNullable";
import { PrimaryGeneratedColumn } from "../../typings/PrimaryGeneratedColumn";

export abstract class BelongsAccessorBase<Target extends object,
        Type extends PrimaryGeneratedColumn,
        Options extends Partial<{ nullable: boolean }>>
{
    public abstract get id(): CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options>
    public abstract set id(value: CapsuleNullable<PrimaryGeneratedColumn.ValueType<Type>, Options>);

    public abstract get(): Promise<CapsuleNullable<Target, Options>>;
    public abstract set(obj: CapsuleNullable<Target, Options>): Promise<void>;
}