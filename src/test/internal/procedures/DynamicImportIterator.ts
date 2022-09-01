import cli from "cli";
import fs from "fs";

import { StopWatch } from "./StopWatch";

const EXTENSION = __filename.substr(-2);
if (EXTENSION === "js") require("source-map-support/register");

interface ICommand {
    include?: string;
    exclude?: string;
}

export namespace DynamicImportIterator {
    export type Closure<Arguments extends any[]> = (
        ...args: Arguments
    ) => Promise<void>;
    type Module<Arguments extends any[]> = {
        [key: string]: Closure<Arguments>;
    };

    export interface IOptions<Parameters extends any[]> {
        prefix: string;
        parameters: Parameters;
        wrapper?: (name: string, closure: Closure<Parameters>) => Promise<void>;
        showElapsedTime?: boolean;
    }

    export async function main<Arguments extends any[]>(
        path: string,
        options: IOptions<Arguments>,
    ): Promise<void> {
        const command: ICommand = cli.parse();
        await iterate(options, command, path);
    }

    export async function force<Arguments extends any[]>(
        path: string,
        options: IOptions<Arguments>,
    ): Promise<Error[]> {
        const command: ICommand = cli.parse();
        const exceptions: Error[] = [];

        await iterate(options, command, path, exceptions);
        return exceptions;
    }

    async function iterate<Arguments extends any[]>(
        options: IOptions<Arguments>,
        command: ICommand,
        path: string,
        exceptions?: Error[],
    ): Promise<void> {
        const directory: string[] = await fs.promises.readdir(path);
        for (const file of directory) {
            const current: string = `${path}/${file}`;
            const stats: fs.Stats = await fs.promises.lstat(current);

            if (stats.isDirectory() === true) {
                await iterate(options, command, current, exceptions);
                continue;
            } else if (file.substr(-3) !== `.${EXTENSION}`) continue;

            const external: Module<Arguments> = await import(current);
            await execute(options, command, external, exceptions);
        }
    }

    async function execute<Arguments extends any[]>(
        options: IOptions<Arguments>,
        command: ICommand,
        external: Module<Arguments>,
        exceptions?: Error[],
    ): Promise<void> {
        for (const key in external) {
            if (command.exclude && key.indexOf(command.exclude) !== -1)
                continue;
            else if (command.include && key.indexOf(command.include) === -1)
                continue;
            else if (key.substr(0, options.prefix.length) !== options.prefix)
                continue;
            else if (external[key] instanceof Function) {
                const closure: Closure<Arguments> = external[key];
                try {
                    if (options.showElapsedTime === false) {
                        console.log(`  - ${key}`);
                        if (options.wrapper !== undefined)
                            await options.wrapper(key, closure);
                        else await closure(...options.parameters);
                    } else
                        await StopWatch.trace(`  - ${key}`, async () => {
                            if (options.wrapper !== undefined)
                                await options.wrapper(key, closure);
                            else await closure(...options.parameters);
                        });
                } catch (exp) {
                    if (exp instanceof Error && exceptions !== undefined) {
                        console.log(" -> " + exp.name);
                        exceptions.push(exp);
                    } else throw exp;
                }
            }
        }
    }
}
