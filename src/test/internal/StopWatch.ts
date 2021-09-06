export namespace StopWatch
{
    export type Task = () => Promise<void>;

    export async function measure(task: Task): Promise<number>
    {
        const time: number = Date.now();
        await task();
        return Date.now() - time;
    }

    export async function trace(title: string, task: Task): Promise<void>
    {
        process.stdout.write(title);
        console.log(`: ${(await measure(task)).toLocaleString()} ms`);
    }
}