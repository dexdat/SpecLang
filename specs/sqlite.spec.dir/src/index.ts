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
export const STATE_DB_CORRUPT_CODE = 'STATE_DB_CORRUPT';

/** SQLite result codes that mean "this file is not a database we can read". */
const NOT_A_DATABASE_CODES = ['SQLITE_NOTADB'];

/**
 * Thrown when the state database file exists but cannot be read as SQLite.
 */
export class CorruptStateDatabaseError extends Error {
  /** Stable, machine-checkable error code (see STATE_DB_CORRUPT_CODE). */
  code: typeof STATE_DB_CORRUPT_CODE;
  /** The state database file that could not be read. */
  filePath: string;
  /** SQLite's own result code for the failure (e.g. SQLITE_NOTADB), when known. */
  sqliteCode?: string;
  /** The original better-sqlite3 error, kept for diagnostics. */
  cause?: unknown;

  constructor(filePath: string, cause?: unknown) {
    super(stateDatabaseCorruptionMessage(filePath));
    this.name = 'CorruptStateDatabaseError';
    this.code = STATE_DB_CORRUPT_CODE;
    this.filePath = filePath;
    this.sqliteCode = (cause as { code?: string } | undefined)?.code;
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CorruptStateDatabaseError);
    }
  }
}

/**
 * True when a better-sqlite3 error says the file is not a SQLite database.
 */
export function isNotADatabaseError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code;
  const message = String((err as { message?: string } | undefined)?.message ?? '');
  return (
    (typeof code === 'string' && NOT_A_DATABASE_CODES.includes(code)) ||
    /file is not a database/i.test(message)
  );
}

/**
 * The user-facing diagnostic for a corrupt state DB: what is wrong, which file,
 * and the documented way out (docs/troubleshooting.md -> Emergency Recovery).
 *
 * The CLI (bin/speclang) prints this same text from its own copy because it runs
 * before `npm run build` and cannot import TypeScript; tests/db/corrupt-state-db
 * pins both copies to one wording so they cannot drift apart.
 */
export function stateDatabaseCorruptionMessage(filePath: string): string {
  return [
    `The SpecLang state database is corrupt or not a SQLite database: ${filePath}`,
    'SpecLang cannot read this project\'s state from that file, so it refuses to continue',
    'rather than report a status that unreadable state does not back.',
    '',
    'Recovery: back the file up if you need it as evidence, then delete it so SpecLang',
    'rebuilds a fresh database on the next run. The full fresh-start procedure is in',
    'docs/troubleshooting.md -> "Emergency Recovery":',
    `  rm -f ${filePath}`
  ].join('\n');
}

/**
 * Open the state database and prove it is readable before handing it out.
 *
 * A missing file is fresh state (better-sqlite3 creates it) — only a file that
 * exists and is not a database raises CorruptStateDatabaseError.
 */
export function openStateDatabase(path: string): DatabaseType {
  let db: DatabaseType | undefined;
  try {
    db = new Database(path);
    // The constructor does not read the file header; this statement does.
    db.pragma('user_version');
    return db;
  } catch (err) {
    if (db) {
      try {
        db.close();
      } catch {
        // An unreadable file has no handle worth closing.
      }
    }
    if (isNotADatabaseError(err)) {
      throw new CorruptStateDatabaseError(path, err);
    }
    throw err;
  }
}

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
export function withStateDatabase<T>(db: DatabaseType, filePath: string, setup: () => T): T {
  try {
    return setup();
  } catch (err) {
    try {
      db.close();
    } catch {
      // An unreadable file has no handle worth closing.
    }
    if (isNotADatabaseError(err)) {
      throw new CorruptStateDatabaseError(filePath, err);
    }
    throw err;
  }
}

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
    
    // Initialize database — QA-SPECLANG-5: the single guarded open path. A file
    // that is not a SQLite database raises CorruptStateDatabaseError here, so no
    // command can go on to report state it could not read.
    this.db = openStateDatabase(config.path);
    
    // Configure database. A file that survived the open probe can still be
    // damaged deeper in (these pragmas read the header/btree pages), so the same
    // diagnostic applies instead of leaking a bare SqliteError.
    withStateDatabase(this.db, config.path, () => this.configure());
    
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
    // stderr: this fires inside MCP stdio mode where stdout is the JSON-RPC transport
    console.error(`Database initialized at version ${result.currentVersion}`);
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
