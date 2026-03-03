/**
 * SPECLANG-GENERATED: Main SQLite database class
 * Source: @speclang/sqlite @block:sqlite/schema
 */
import { type Database as DatabaseType } from 'better-sqlite3';
import type { SpecRecord, SessionRecord, EventRecord, CommandRecord, LockRecord, RecoveryRecord, SpecInput, DatabaseConfig } from './types.js';
import { FullTextSearch, VectorSearch, GraphQueries, JSONQueries } from './search.js';
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