import { must_not_query_anything } from "../internal/must_not_query_anything";
import { BbsGroup } from "../models/BbsGroup";
import { iterate_bbs_group } from "../preparations/iterate_bbs_group";
import { test_insert_collection } from "./test_insert_collection";

export async function test_relationship_setter(): Promise<void>
{
    const group: BbsGroup = await test_insert_collection();
    await must_not_query_anything
    (
        "Relationship.set()", 
        () => iterate_bbs_group(group)
    );
}