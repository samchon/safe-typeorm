import { Vector } from "tstl/container/Vector";

export namespace TestLogger {
    export const queue: Vector<string> = new Vector();

    export function logQuery(query: string) {
        queue.push_back(query);
    }
    export function logQueryError() {}
    export function logQuerySlow() {}
    export function logSchemaBuild() {}
    export function logMigration() {}
    export function log() {}
}
