export interface SpecRow {
    file_path: string;
    id: string;
    parent_id: string | null;
    children: string[];
    owner_session: string | null;
    depends_on: string[];
    tags: string[];
    short_desc: string;
    header_raw: string;
    content_raw: string;
    content_embedding: Buffer | null;
    parsed_json: any;
    part: number;
    total_parts: number;
    last_edited: number;
    git_commit: string | null;
}
export interface SessionRow {
    id: string;
    agent: string;
    owns: string[];
    status: 'active' | 'idle' | 'done' | 'error';
    last_active: number;
}
export declare class SpeclangDatabase {
    private db;
    initialize(path?: string): Promise<void>;
    private loadMigration;
}
//# sourceMappingURL=speclang-db.d.ts.map