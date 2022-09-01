export interface IBbsCategory {
    id: string;
    parent: IBbsCategory | null;
    code: string;
    name: string;
    created_at: string;
    deleted_at: string | null;
}
