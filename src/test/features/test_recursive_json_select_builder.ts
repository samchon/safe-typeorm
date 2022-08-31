import safe from "../..";
import { BbsCategory } from "../models/bbs/BbsCategory";
import { test_recursive_app_join_builder_belongs_to } from "./test_recursive_app_join_builder_belongs_to";

export async function test_recursive_json_select_builder(): Promise<void> {
    const top: BbsCategory = await test_recursive_app_join_builder_belongs_to();
    const builder = safe.createJsonSelectBuilder(BbsCategory, {
        parent: "recursive",
    });
    const data = await builder.getOne(top);
    const regular: ICategory = data;
    const inverse: typeof data = regular;
    inverse;
}

interface ICategory {
    id: string;
    parent: ICategory | null;
    code: string;
    name: string;
    created_at: string;
    deleted_at: string | null;
}
