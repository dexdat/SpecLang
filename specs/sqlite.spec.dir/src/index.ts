/**
 * SPECLANG-GENERATED: Main SQLite database class
 * Source: @speclang/sqlite @block:sqlite/schema
 */

import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { migrate, getCurrentVersion } from './migrations.js';
import type { 
  SpecRecord, 
  SessionRecord, 
  EventRecord, 
  CommandRecord, 
  LockRecord,
  RecoveryRecord,
  SpecInput,
  DatabaseConfig 
} from './types.js';
import { FullTextSearch, VectorSearch, GraphQueries, JSONQueries } from './search.js';

/**
 * Main database class for SpecLang
 */
export class SpecLangDB {
  private db: DatabaseType;
  private config: DatabaseConfig;
  
  // Search modules
  public fts: FullTextSearch;
  public vectors: VectorSearch;
  public graph: GraphQueries;
  public json: JSONQueries;

  constructor(config: DatabaseConfig) {
    this.config = config;
    
    // Initialize database
    this.db = new Database(config.path);
    
    // Configure database
    this.configure();
    
    // Initialize search modules
    this.fts = new FullTextSearch(this.db);
    this.vectors = new VectorSearch(this.db);
    this.graph = new GraphQueries(this.db);
    this.json = new JSONQueries(this.db);
  }

  /**
   * Configure database settings
   */
  private configure(): void {
    // Enable WAL mode for better concurrency
    if (this.config.wal !== false) {
      this.db.pragma('journal_mode = WAL');
    }
    
    // Performance pragmas
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 10000');
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Initialize database and run migrations
   */
  initialize(): { applied: number; version: number } {
    const result = migrate(this.db);
    console.log(`Database initialized at version ${result.currentVersion}`);
    return {
      applied: result.applied,
      version: result.currentVersion
    };
  }

  /**
   * Get the underlying database instance
   */
  getDatabase(): DatabaseType {
    return this.db;
  }

  // ==========================================================================
  // SPECS OPERATIONS
  // ==========================================================================

  /**
   * Insert or update a spec
   */
  upsertSpec(spec: SpecInput): void {
    const stmt = this.db.prepare(`
      INSERT INTO specs (
        file_path, id, parent_id, children, owner_session, depends_on, tags,
        short_desc, header_raw, header_lines, content_raw, content_embedding,
        parsed_json, part, total_parts, last_edited, git_commit
      ) VALUES (
        @file_path, @id, @parent_id, @children, @owner_session, @depends_on, @tags,
        @short_desc, @header_raw, @header_lines, @content_raw, @content_embedding,
        @parsed_json, @part, @total_parts, @last_edited, @git_commit
      ) ON CONFLICT(file_path) DO UPDATE SET
        id = excluded.id,
        parent_id = excluded.parent_id,
        children = excluded.children,
        owner_session = excluded.owner_session,
        depends_on = excluded.depends_on,
        tags = excluded.tags,
        short_desc = excluded.short_desc,
        header_raw = excluded.header_raw,
        header_lines = excluded.header_lines,
        content_raw = excluded.content_raw,
        content_embedding = excluded.content_embedding,
        parsed_json = excluded.parsed_json,
        part = excluded.part,
        total_parts = excluded.total_parts,
        last_edited = excluded.last_edited,
        git_commit = excluded.git_commit
    `);

    stmt.run({
      file_path: spec.file_path,
      id: spec.id ?? null,
      parent_id: spec.parent_id ?? null,
      children: JSON.stringify(spec.children ?? []),
      owner_session: spec.owner_session ?? null,
      depends_on: JSON.stringify(spec.depends_on ?? []),
      tags: JSON.stringify(spec.tags ?? []),
      short_desc: spec.short_desc ?? null,
      header_raw: spec.header_raw ?? '',
      header_lines: spec.header_lines ?? 0,
      content_raw: spec.content_raw ?? '',
      content_embedding: spec.content_embedding ?? null,
      parsed_json: spec.parsed_json ? JSON.stringify(spec.parsed_json) : null,
      part: spec.part ?? 1,
      total_parts: spec.total_parts ?? 1,
      last_edited: spec.last_edited ?? Date.now(),
      git_commit: spec.git_commit ?? null
    });
  }

  /**
   * Get a spec by file path
   */
  getSpec(filePath: string): SpecRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM specs WHERE file_path = ?');
    const row = stmt.get(filePath) as SpecRecord | undefined;
    if (row) {
      return this.parseSpecRow(row);
    }
    return undefined;
  }

  /**
   * Get all specs
   */
  getAllSpecs(): SpecRecord[] {
    const stmt = this.db.prepare('SELECT * FROM specs');
    const rows = stmt.all() as SpecRecord[];
    return rows.map(row => this.parseSpecRow(row));
  }

  /**
   * Delete a spec
   */
  deleteSpec(filePath: string): void {
    const stmt = this.db.prepare('DELETE FROM specs WHERE file_path = ?');
    stmt.run(filePath);
  }

  /**
   * Parse spec row, converting JSON strings to arrays/objects
   */
  private parseSpecRow(row: SpecRecord): SpecRecord {
    return {
      ...row,
      children: JSON.parse(row.children as unknown as string || '[]'),
      depends_on: JSON.parse(row.depends_on as unknown as string || '[]'),
      tags: JSON.parse(row.tags as unknown as string || '[]'),
      parsed_json: row.parsed_json ? JSON.parse(row.parsed_json as unknown as string) : null
    };
  }

  // ==========================================================================
  // SESSION OPERATIONS
  // ==========================================================================

  /**
   * Create or update a session
   */
  upsertSession(session: SessionRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, agent, owns, status, last_active)
      VALUES (@id, @agent, @owns, @status, @last_active)
      ON CONFLICT(id) DO UPDATE SET
        agent = excluded.agent,
        owns = excluded.owns,
        status = excluded.status,
        last_active = excluded.last_active
    `);

    stmt.run({
      id: session.id,
      agent: session.agent,
      owns: JSON.stringify(session.owns),
      status: session.status,
      last_active: session.last_active
    });
  }

  /**
   * Get a session by ID
   */
  getSession(id: string): SessionRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as SessionRecord | undefined;
    if (row) {
      return {
        ...row,
        owns: JSON.parse(row.owns as unknown as string || '[]')
      };
    }
    return undefined;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): SessionRecord[] {
    const stmt = this.db.prepare("SELECT * FROM sessions WHERE status = 'active'");
    const rows = stmt.all() as SessionRecord[];
    return rows.map(row => ({
      ...row,
      owns: JSON.parse(row.owns as unknown as string || '[]')
    }));
  }

  /**
   * Delete a session
   */
  deleteSession(id: string): void {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
  }

  // ==========================================================================
  // EVENT OPERATIONS
  // ==========================================================================

  /**
   * Insert an event
   */
  insertEvent(event: Omit<EventRecord, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO events (timestamp, kind, path, session, cascade_id, details)
      VALUES (@timestamp, @kind, @path, @session, @cascade_id, @details)
    `);

    const result = stmt.run({
      timestamp: event.timestamp,
      kind: event.kind,
      path: event.path ?? null,
      session: event.session ?? null,
      cascade_id: event.cascade_id ?? null,
      details: event.details ? JSON.stringify(event.details) : null
    });

    return result.lastInsertRowid as number;
  }

  /**
   * Get events by cascade ID
   */
  getEventsByCascade(cascadeId: string): EventRecord[] {
    const stmt = this.db.prepare('SELECT * FROM events WHERE cascade_id = ? ORDER BY timestamp');
    const rows = stmt.all(cascadeId) as EventRecord[];
    return rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details as unknown as string) : null
    }));
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): EventRecord[] {
    const stmt = this.db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?');
    const rows = stmt.all(limit) as EventRecord[];
    return rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details as unknown as string) : null
    }));
  }

  // ==========================================================================
  // COMMAND OPERATIONS
  // ==========================================================================

  /**
   * Insert a command
   */
  insertCommand(command: CommandRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO commands (id, session_id, cascade_id, action, target, payload, status, created_at)
      VALUES (@id, @session_id, @cascade_id, @action, @target, @payload, @status, @created_at)
    `);

    stmt.run({
      id: command.id,
      session_id: command.session_id ?? null,
      cascade_id: command.cascade_id ?? null,
      action: command.action,
      target: command.target ?? null,
      payload: command.payload ? JSON.stringify(command.payload) : null,
      status: command.status,
      created_at: command.created_at
    });
  }

  /**
   * Update command status
   */
  updateCommandStatus(id: string, status: CommandRecord['status']): void {
    const stmt = this.db.prepare('UPDATE commands SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  /**
   * Get pending commands
   */
  getPendingCommands(limit: number = 50): CommandRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM commands 
      WHERE status = 'pending' 
      ORDER BY created_at 
      LIMIT ?
    `);
    const rows = stmt.all(limit) as CommandRecord[];
    return rows.map(row => ({
      ...row,
      payload: row.payload ? JSON.parse(row.payload as unknown as string) : null
    }));
  }

  /**
   * Get commands by cascade ID
   */
  getCommandsByCascade(cascadeId: string): CommandRecord[] {
    const stmt = this.db.prepare('SELECT * FROM commands WHERE cascade_id = ? ORDER BY created_at');
    const rows = stmt.all(cascadeId) as CommandRecord[];
    return rows.map(row => ({
      ...row,
      payload: row.payload ? JSON.parse(row.payload as unknown as string) : null
    }));
  }

  // ==========================================================================
  // LOCK OPERATIONS
  // ==========================================================================

  /**
   * Acquire a lock on a file
   */
  acquireLock(filePath: string, sessionId: string, ttlMs?: number): boolean {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    
    try {
      const stmt = this.db.prepare(`
        INSERT INTO locks (file_path, session_id, locked_at, expires_at)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(filePath, sessionId, Date.now(), expiresAt);
      return true;
    } catch {
      // Lock already exists
      return false;
    }
  }

  /**
   * Release a lock on a file
   */
  releaseLock(filePath: string, sessionId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM locks 
      WHERE file_path = ? AND session_id = ?
    `);
    const result = stmt.run(filePath, sessionId);
    return result.changes > 0;
  }

  /**
   * Get lock for a file
   */
  getLock(filePath: string): LockRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM locks WHERE file_path = ?');
    return stmt.get(filePath) as LockRecord | undefined;
  }

  /**
   * Check if file is locked
   */
  isLocked(filePath: string): boolean {
    const lock = this.getLock(filePath);
    if (!lock) return false;
    
    // Check if lock has expired
    if (lock.expires_at && lock.expires_at < Date.now()) {
      this.releaseLock(filePath, lock.session_id);
      return false;
    }
    
    return true;
  }

  // ==========================================================================
  // RECOVERY OPERATIONS
  // ==========================================================================

  /**
   * Record a recovery operation
   */
  recordRecovery(operation: string, state: object): number {
    const stmt = this.db.prepare(`
      INSERT INTO recovery (timestamp, operation, state, recovered)
      VALUES (?, ?, ?, 0)
    `);
    const result = stmt.run(Date.now(), operation, JSON.stringify(state));
    return result.lastInsertRowid as number;
  }

  /**
   * Mark recovery as complete
   */
  markRecovered(id: number): void {
    const stmt = this.db.prepare('UPDATE recovery SET recovered = 1 WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Get unrecovered operations
   */
  getUnrecovered(): RecoveryRecord[] {
    const stmt = this.db.prepare('SELECT * FROM recovery WHERE recovered = 0 ORDER BY timestamp');
    const rows = stmt.all() as RecoveryRecord[];
    return rows.map(row => ({
      ...row,
      state: JSON.parse(row.state as unknown as string),
      recovered: Boolean(row.recovered)
    }));
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get database version
   */
  getVersion(): number {
    return getCurrentVersion(this.db);
  }

  /**
   * Vacuum the database
   */
  vacuum(): void {
    this.db.exec('VACUUM');
  }

  /**
   * Begin a transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }
}

/**
 * Create a new database instance
 */
export function createDatabase(config?: Partial<DatabaseConfig>): SpecLangDB {
  const db = new SpecLangDB({
    path: config?.path ?? '.speclang/speclang.db',
    wal: config?.wal ?? true,
    verbose: config?.verbose ?? false
  });
  db.initialize();
  return db;
}

export { FullTextSearch, VectorSearch, GraphQueries, JSONQueries };
