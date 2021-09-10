import { TestLogger } from "./TesLogger";

export async function must_not_query_anything<T>
    (
        title: string,
        task: () => Promise<T>
    ): Promise<T>
{
    TestLogger.queue.clear();
    const output: T = await task();
    
    if (TestLogger.queue.size() !== 0)
    {
        console.log(TestLogger.queue.data());
        throw new Error(`Bug on ${title}: any query must not been occured.`);
    }
    return output;
}