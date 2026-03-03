"use strict";
/**
 * SPECLANG-GENERATED: Main SQLite database class
 * Source: @speclang/sqlite @block:sqlite/schema
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONQueries = exports.GraphQueries = exports.VectorSearch = exports.FullTextSearch = exports.SpecLangDB = void 0;
exports.createDatabase = createDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const migrations_js_1 = require("./migrations.js");
const search_js_1 = require("./search.js");
Object.defineProperty(exports, "FullTextSearch", { enumerable: true, get: function () { return search_js_1.FullTextSearch; } });
Object.defineProperty(exports, "VectorSearch", { enumerable: true, get: function () { return search_js_1.VectorSearch; } });
Object.defineProperty(exports, "GraphQueries", { enumerable: true, get: function () { return search_js_1.GraphQueries; } });
Object.defineProperty(exports, "JSONQueries", { enumerable: true, get: function () { return search_js_1.JSONQueries; } });
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
        // Initialize database
        this.db = new better_sqlite3_1.default(config.path);
        // Configure database
        this.configure();
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
        console.log(`Database initialized at version ${result.currentVersion}`);
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