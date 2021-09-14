import { generate_random_clean_groups } from "../internal/generators/generate_random_clean_groups";

export async function test_insert_collection(): Promise<void>
{
    await generate_random_clean_groups();
}