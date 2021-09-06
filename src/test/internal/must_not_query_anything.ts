import { TestLogger } from "./TesLogger";

export async function must_not_query_anything
    (
        title: string,
        task: () => Promise<void>
    ): Promise<void>
{
    TestLogger.queue.clear();
    await task();
    
    if (TestLogger.queue.size() !== 0)
    {
        console.log(TestLogger.queue.data());
        throw new Error(`Bug on ${title}: any query must not been occured.`);
    }
}