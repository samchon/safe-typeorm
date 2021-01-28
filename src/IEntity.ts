export interface IEntity<PrimaryKey>
{
    id: PrimaryKey;
}

export namespace IEntity
{
    export type KeyType<Entity extends IEntity<any>> = Entity extends IEntity<infer Key> ? Key : never;
}