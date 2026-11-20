/**
 * SPECLANG-GENERATED: Main SQLite database class
 * Source: @speclang/sqlite @block:sqlite/schema
 */
import { type Database as DatabaseType } from 'better-sqlite3';
import type { SpecRecord, SessionRecord, EventRecord, CommandRecord, LockRecord, RecoveryRecord, SpecInput, DatabaseConfig } from './types.js';
import { FullTextSearch, VectorSearch, GraphQueries, JSONQueries } from './search.js';
/**
 * QA-SPECLANG-5: a state database that is not a SQLite database at all used to
 * be accepted silently. better-sqlite3 defers reading the file header until the
 * first statement is prepared, so a corrupt `.speclang/speclang.db` either died
 * later with a raw `SqliteError: file is not a database` (no path, no remedy) or
 * — for commands that never opened it, such as `speclang status` — produced a
 * normal-looking report backed by nothing.
 *
 * Everything below is the single guarded open path for the state DB, so every
 * consumer inherits the same loud, actionable failure instead of a no-op.
 */
export declare const STATE_DB_CORRUPT_CODE = "STATE_DB_CORRUPT";
/**
 * Thrown when the state database file exists but cannot be read as SQLite.
 */
export declare class CorruptStateDatabaseError extends Error {
    /** Stable, machine-checkable error code (see STATE_DB_CORRUPT_CODE). */
    code: typeof STATE_DB_CORRUPT_CODE;
    /** The state database file that could not be read. */
    filePath: string;
    /** SQLite's own result code for the failure (e.g. SQLITE_NOTADB), when known. */
    sqliteCode?: string;
    /** The original better-sqlite3 error, kept for diagnostics. */
    cause?: unknown;
    constructor(filePath: string, cause?: unknown);
}
/**
 * True when a better-sqlite3 error says the file is not a SQLite database.
 */
export declare function isNotADatabaseError(err: unknown): boolean;
/**
 * The user-facing diagnostic for a corrupt state DB: what is wrong, which file,
 * and the documented way out (docs/troubleshooting.md -> Emergency Recovery).
 *
 * The CLI (bin/speclang) prints this same text from its own copy because it runs
 * before `npm run build` and cannot import TypeScript; tests/db/corrupt-state-db
 * pins both copies to one wording so they cannot drift apart.
 */
export declare function stateDatabaseCorruptionMessage(filePath: string): string;
/**
 * Open the state database and prove it is readable before handing it out.
 *
 * A missing file is fresh state (better-sqlite3 creates it) — only a file that
 * exists and is not a database raises CorruptStateDatabaseError.
 */
export declare function openStateDatabase(path: string): DatabaseType;
/**
 * Run `setup` against an already-opened state database, translating a deeper
 * not-a-database failure into the same CorruptStateDatabaseError diagnostic.
 *
 * The open probe reads the file header only; a consumer that bootstraps its own
 * schema (or its own pragmas) reads further and can still meet a file that is
 * not a database. One shared helper keeps that failure loud and identical for
 * every consumer — SpecLangDB, the standalone MCP server, the Ralph Loop —
 * instead of each one leaking a bare SqliteError.
 */
export declare function withStateDatabase<T>(db: DatabaseType, filePath: string, setup: () => T): T;
/**
 * Main database class for SpecLang
 */
export declare class SpecLangDB {
    private db;
    private config;
    fts: FullTextSearch;
    vectors: VectorSearch;
    graph: GraphQueries;
    json: JSONQueries;
    constructor(config: DatabaseConfig);
    /**
     * Configure database settings
     */
    private configure;
    /**
     * Initialize database and run migrations
     */
    initialize(): {
        applied: number;
        version: number;
    };
    /**
     * Get the underlying database instance
     */
    getDatabase(): DatabaseType;
    /**
     * Insert or update a spec
     */
    upsertSpec(spec: SpecInput): void;
    /**
     * Get a spec by file path
     */
    getSpec(filePath: string): SpecRecord | undefined;
    /**
     * Get all specs
     */
    getAllSpecs(): SpecRecord[];
    /**
     * Delete a spec
     */
    deleteSpec(filePath: string): void;
    /**
     * Parse spec row, converting JSON strings to arrays/objects
     */
    private parseSpecRow;
    /**
     * Create or update a session
     */
    upsertSession(session: SessionRecord): void;
    /**
     * Get a session by ID
     */
    getSession(id: string): SessionRecord | undefined;
    /**
     * Get all active sessions
     */
    getActiveSessions(): SessionRecord[];
    /**
     * Delete a session
     */
    deleteSession(id: string): void;
    /**
     * Insert an event
     */
    insertEvent(event: Omit<EventRecord, 'id'>): number;
    /**
     * Get events by cascade ID
     */
    getEventsByCascade(cascadeId: string): EventRecord[];
    /**
     * Get recent events
     */
    getRecentEvents(limit?: number): EventRecord[];
    /**
     * Insert a command
     */
    insertCommand(command: CommandRecord): void;
    /**
     * Update command status
     */
    updateCommandStatus(id: string, status: CommandRecord['status']): void;
    /**
     * Get pending commands
     */
    getPendingCommands(limit?: number): CommandRecord[];
    /**
     * Get commands by cascade ID
     */
    getCommandsByCascade(cascadeId: string): CommandRecord[];
    /**
     * Acquire a lock on a file
     */
    acquireLock(filePath: string, sessionId: string, ttlMs?: number): boolean;
    /**
     * Release a lock on a file
     */
    releaseLock(filePath: string, sessionId: string): boolean;
    /**
     * Get lock for a file
     */
    getLock(filePath: string): LockRecord | undefined;
    /**
     * Check if file is locked
     */
    isLocked(filePath: string): boolean;
    /**
     * Record a recovery operation
     */
    recordRecovery(operation: string, state: object): number;
    /**
     * Mark recovery as complete
     */
    markRecovered(id: number): void;
    /**
     * Get unrecovered operations
     */
    getUnrecovered(): RecoveryRecord[];
    /**
     * Close the database connection
     */
    close(): void;
    /**
     * Get database version
     */
    getVersion(): number;
    /**
     * Vacuum the database
     */
    vacuum(): void;
    /**
     * Begin a transaction
     */
    transaction<T>(fn: () => T): T;
}
/**
 * Create a new database instance
 */
export declare function createDatabase(config?: Partial<DatabaseConfig>): SpecLangDB;
export { FullTextSearch, VectorSearch, GraphQueries, JSONQueries };
//# sourceMappingURL=index.d.ts.map