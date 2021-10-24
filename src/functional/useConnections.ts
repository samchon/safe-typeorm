import * as orm from "typeorm";

export function useConnections(): void
{
    for (const connection of orm.getConnectionManager().connections)
        for (const entity of connection.entityMetadatas)
            if (typeof entity.target === "function" && entity.target.prototype instanceof orm.BaseEntity)
                (entity.target as typeof orm.BaseEntity).useConnection(connection);
}