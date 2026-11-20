"use strict";
/**
 * SPECLANG-GENERATED: Main SQLite database class
 * Source: @speclang/sqlite @block:sqlite/schema
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONQueries = exports.GraphQueries = exports.VectorSearch = exports.FullTextSearch = exports.SpecLangDB = exports.CorruptStateDatabaseError = exports.STATE_DB_CORRUPT_CODE = void 0;
exports.isNotADatabaseError = isNotADatabaseError;
exports.stateDatabaseCorruptionMessage = stateDatabaseCorruptionMessage;
exports.openStateDatabase = openStateDatabase;
exports.withStateDatabase = withStateDatabase;
exports.createDatabase = createDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const migrations_js_1 = require("./migrations.js");
const search_js_1 = require("./search.js");
Object.defineProperty(exports, "FullTextSearch", { enumerable: true, get: function () { return search_js_1.FullTextSearch; } });
Object.defineProperty(exports, "VectorSearch", { enumerable: true, get: function () { return search_js_1.VectorSearch; } });
Object.defineProperty(exports, "GraphQueries", { enumerable: true, get: function () { return search_js_1.GraphQueries; } });
Object.defineProperty(exports, "JSONQueries", { enumerable: true, get: function () { return search_js_1.JSONQueries; } });
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
exports.STATE_DB_CORRUPT_CODE = 'STATE_DB_CORRUPT';
/** SQLite result codes that mean "this file is not a database we can read". */
const NOT_A_DATABASE_CODES = ['SQLITE_NOTADB'];
/**
 * Thrown when the state database file exists but cannot be read as SQLite.
 */
class CorruptStateDatabaseError extends Error {
    /** Stable, machine-checkable error code (see STATE_DB_CORRUPT_CODE). */
    code;
    /** The state database file that could not be read. */
    filePath;
    /** SQLite's own result code for the failure (e.g. SQLITE_NOTADB), when known. */
    sqliteCode;
    /** The original better-sqlite3 error, kept for diagnostics. */
    cause;
    constructor(filePath, cause) {
        super(stateDatabaseCorruptionMessage(filePath));
        this.name = 'CorruptStateDatabaseError';
        this.code = exports.STATE_DB_CORRUPT_CODE;
        this.filePath = filePath;
        this.sqliteCode = cause?.code;
        this.cause = cause;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CorruptStateDatabaseError);
        }
    }
}
exports.CorruptStateDatabaseError = CorruptStateDatabaseError;
/**
 * True when a better-sqlite3 error says the file is not a SQLite database.
 */
function isNotADatabaseError(err) {
    const code = err?.code;
    const message = String(err?.message ?? '');
    return ((typeof code === 'string' && NOT_A_DATABASE_CODES.includes(code)) ||
        /file is not a database/i.test(message));
}
/**
 * The user-facing diagnostic for a corrupt state DB: what is wrong, which file,
 * and the documented way out (docs/troubleshooting.md -> Emergency Recovery).
 *
 * The CLI (bin/speclang) prints this same text from its own copy because it runs
 * before `npm run build` and cannot import TypeScript; tests/db/corrupt-state-db
 * pins both copies to one wording so they cannot drift apart.
 */
function stateDatabaseCorruptionMessage(filePath) {
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
function openStateDatabase(path) {
    let db;
    try {
        db = new better_sqlite3_1.default(path);
        // The constructor does not read the file header; this statement does.
        db.pragma('user_version');
        return db;
    }
    catch (err) {
        if (db) {
            try {
                db.close();
            }
            catch {
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
function withStateDatabase(db, filePath, setup) {
    try {
        return setup();
    }
    catch (err) {
        try {
            db.close();
        }
        catch {
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
class SpecLangDB {
    db;
    config;
    // Search modules
    fts;
    vectors;
    graph;
    json;
    constructor(config) {
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
        this.fts = new search_js_1.FullTextSearch(this.db);
        this.vectors = new search_js_1.VectorSearch(this.db);
        this.graph = new search_js_1.GraphQueries(this.db);
        this.json = new search_js_1.JSONQueries(this.db);
    }
    /**
     * Configure database settings
     */
    configure() {
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
    initialize() {
        const result = (0, migrations_js_1.migrate)(this.db);
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
    getDatabase() {
        return this.db;
    }
    // ==========================================================================
    // SPECS OPERATIONS
    // ==========================================================================
    /**
     * Insert or update a spec
     */
    upsertSpec(spec) {
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
    getSpec(filePath) {
        const stmt = this.db.prepare('SELECT * FROM specs WHERE file_path = ?');
        const row = stmt.get(filePath);
        if (row) {
            return this.parseSpecRow(row);
        }
        return undefined;
    }
    /**
     * Get all specs
     */
    getAllSpecs() {
        const stmt = this.db.prepare('SELECT * FROM specs');
        const rows = stmt.all();
        return rows.map(row => this.parseSpecRow(row));
    }
    /**
     * Delete a spec
     */
    deleteSpec(filePath) {
        const stmt = this.db.prepare('DELETE FROM specs WHERE file_path = ?');
        stmt.run(filePath);
    }
    /**
     * Parse spec row, converting JSON strings to arrays/objects
     */
    parseSpecRow(row) {
        return {
            ...row,
            children: JSON.parse(row.children || '[]'),
            depends_on: JSON.parse(row.depends_on || '[]'),
            tags: JSON.parse(row.tags || '[]'),
            parsed_json: row.parsed_json ? JSON.parse(row.parsed_json) : null
        };
    }
    // ==========================================================================
    // SESSION OPERATIONS
    // ==========================================================================
    /**
     * Create or update a session
     */
    upsertSession(session) {
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
    getSession(id) {
        const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
        const row = stmt.get(id);
        if (row) {
            return {
                ...row,
                owns: JSON.parse(row.owns || '[]')
            };
        }
        return undefined;
    }
    /**
     * Get all active sessions
     */
    getActiveSessions() {
        const stmt = this.db.prepare("SELECT * FROM sessions WHERE status = 'active'");
        const rows = stmt.all();
        return rows.map(row => ({
            ...row,
            owns: JSON.parse(row.owns || '[]')
        }));
    }
    /**
     * Delete a session
     */
    deleteSession(id) {
        const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
        stmt.run(id);
    }
    // ==========================================================================
    // EVENT OPERATIONS
    // ==========================================================================
    /**
     * Insert an event
     */
    insertEvent(event) {
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
        return result.lastInsertRowid;
    }
    /**
     * Get events by cascade ID
     */
    getEventsByCascade(cascadeId) {
        const stmt = this.db.prepare('SELECT * FROM events WHERE cascade_id = ? ORDER BY timestamp');
        const rows = stmt.all(cascadeId);
        return rows.map(row => ({
            ...row,
            details: row.details ? JSON.parse(row.details) : null
        }));
    }
    /**
     * Get recent events
     */
    getRecentEvents(limit = 100) {
        const stmt = this.db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT ?');
        const rows = stmt.all(limit);
        return rows.map(row => ({
            ...row,
            details: row.details ? JSON.parse(row.details) : null
        }));
    }
    // ==========================================================================
    // COMMAND OPERATIONS
    // ==========================================================================
    /**
     * Insert a command
     */
    insertCommand(command) {
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
    updateCommandStatus(id, status) {
        const stmt = this.db.prepare('UPDATE commands SET status = ? WHERE id = ?');
        stmt.run(status, id);
    }
    /**
     * Get pending commands
     */
    getPendingCommands(limit = 50) {
        const stmt = this.db.prepare(`
      SELECT * FROM commands 
      WHERE status = 'pending' 
      ORDER BY created_at 
      LIMIT ?
    `);
        const rows = stmt.all(limit);
        return rows.map(row => ({
            ...row,
            payload: row.payload ? JSON.parse(row.payload) : null
        }));
    }
    /**
     * Get commands by cascade ID
     */
    getCommandsByCascade(cascadeId) {
        const stmt = this.db.prepare('SELECT * FROM commands WHERE cascade_id = ? ORDER BY created_at');
        const rows = stmt.all(cascadeId);
        return rows.map(row => ({
            ...row,
            payload: row.payload ? JSON.parse(row.payload) : null
        }));
    }
    // ==========================================================================
    // LOCK OPERATIONS
    // ==========================================================================
    /**
     * Acquire a lock on a file
     */
    acquireLock(filePath, sessionId, ttlMs) {
        const expiresAt = ttlMs ? Date.now() + ttlMs : null;
        try {
            const stmt = this.db.prepare(`
        INSERT INTO locks (file_path, session_id, locked_at, expires_at)
        VALUES (?, ?, ?, ?)
      `);
            stmt.run(filePath, sessionId, Date.now(), expiresAt);
            return true;
        }
        catch {
            // Lock already exists
            return false;
        }
    }
    /**
     * Release a lock on a file
     */
    releaseLock(filePath, sessionId) {
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
    getLock(filePath) {
        const stmt = this.db.prepare('SELECT * FROM locks WHERE file_path = ?');
        return stmt.get(filePath);
    }
    /**
     * Check if file is locked
     */
    isLocked(filePath) {
        const lock = this.getLock(filePath);
        if (!lock)
            return false;
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
    recordRecovery(operation, state) {
        const stmt = this.db.prepare(`
      INSERT INTO recovery (timestamp, operation, state, recovered)
      VALUES (?, ?, ?, 0)
    `);
        const result = stmt.run(Date.now(), operation, JSON.stringify(state));
        return result.lastInsertRowid;
    }
    /**
     * Mark recovery as complete
     */
    markRecovered(id) {
        const stmt = this.db.prepare('UPDATE recovery SET recovered = 1 WHERE id = ?');
        stmt.run(id);
    }
    /**
     * Get unrecovered operations
     */
    getUnrecovered() {
        const stmt = this.db.prepare('SELECT * FROM recovery WHERE recovered = 0 ORDER BY timestamp');
        const rows = stmt.all();
        return rows.map(row => ({
            ...row,
            state: JSON.parse(row.state),
            recovered: Boolean(row.recovered)
        }));
    }
    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================
    /**
     * Close the database connection
     */
    close() {
        this.db.close();
    }
    /**
     * Get database version
     */
    getVersion() {
        return (0, migrations_js_1.getCurrentVersion)(this.db);
    }
    /**
     * Vacuum the database
     */
    vacuum() {
        this.db.exec('VACUUM');
    }
    /**
     * Begin a transaction
     */
    transaction(fn) {
        return this.db.transaction(fn)();
    }
}
exports.SpecLangDB = SpecLangDB;
/**
 * Create a new database instance
 */
function createDatabase(config) {
    const db = new SpecLangDB({
        path: config?.path ?? '.speclang/speclang.db',
        wal: config?.wal ?? true,
        verbose: config?.verbose ?? false
    });
    db.initialize();
    return db;
}
//# sourceMappingURL=index.js.map