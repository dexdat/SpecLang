/**
 * SPECLANG-GENERATED: TypeScript types for SQLite database
 * Source: @speclang/sqlite @block:sqlite/schema
 */
import type { Database } from 'better-sqlite3';
/** Spec metadata extracted from spec headers */
export interface SpecRecord {
    file_path: string;
    id: string | null;
    parent_id: string | null;
    children: string[];
    owner_session: string | null;
    depends_on: string[];
    tags: string[];
    short_desc: string | null;
    header_raw: string;
    header_lines: number;
    content_raw: string;
    content_embedding: Buffer | null;
    parsed_json: object | null;
    part: number;
    total_parts: number;
    last_edited: number | null;
    git_commit: string | null;
}
/** Session for agent registry */
export interface SessionRecord {
    id: string;
    agent: string;
    owns: string[];
    status: 'active' | 'idle' | 'completed';
    last_active: number;
}
/** Event log for cascade system */
export interface EventRecord {
    id?: number;
    timestamp: number;
    kind: string;
    path?: string | null;
    session?: string | null;
    cascade_id?: string | null;
    details?: object | null;
}
/** Command queue for agents */
export interface CommandRecord {
    id: string;
    session_id?: string | null;
    cascade_id?: string | null;
    action: string;
    target?: string | null;
    payload?: object | null;
    status: 'pending' | 'running' | 'completed' | 'failed';
    created_at: number;
}
/** Lock for concurrent file access */
export interface LockRecord {
    file_path: string;
    session_id: string;
    locked_at: number;
    expires_at: number | null;
}
/** Recovery operations */
export interface RecoveryRecord {
    id?: number;
    timestamp: number;
    operation: string;
    state: object;
    recovered: boolean;
}
/** FTS search result */
export interface SearchResult {
    file_path: string;
    id: string | null;
    short_desc: string | null;
    score: number;
    rank: number;
}
/** Dependency query result */
export interface DependencyResult {
    file_path: string;
    id: string | null;
    short_desc: string | null;
    depth: number;
}
/** Tree query result */
export interface TreeResult {
    file_path: string;
    id: string | null;
    depth: number;
}
/** Input for inserting/updating a spec */
export interface SpecInput {
    file_path: string;
    id?: string | null;
    parent_id?: string | null;
    children?: string[];
    owner_session?: string | null;
    depends_on?: string[];
    tags?: string[];
    short_desc?: string | null;
    header_raw?: string;
    header_lines?: number;
    content_raw?: string;
    content_embedding?: Buffer | null;
    parsed_json?: object | null;
    part?: number;
    total_parts?: number;
    last_edited?: number | null;
    git_commit?: string | null;
}
/** Search options */
export interface SearchOptions {
    query: string;
    limit?: number;
    tags?: string[];
}
/** Vector search options */
export interface VectorSearchOptions {
    embedding: number[];
    limit?: number;
}
export interface Migration {
    version: number;
    name: string;
    up: (db: Database) => void;
    down?: (db: Database) => void;
}
export interface DatabaseConfig {
    path: string;
    wal?: boolean;
    verbose?: boolean;
}
//# sourceMappingURL=types.d.ts.map