"use strict";
/**
 * SPECLANG-GENERATED: Database migration system
 * Source: @speclang/sqlite @block:sqlite/schema
 *
 * NOTE ON GENERATION: this file is maintained by hand. The `sqlite/schema` block
 * in specs/sqlite.spec.dir/schema.spec.md carries the schema *description* only
 * (no TypeScript body), and specs/scripts.spec.dir/generate_sqlite_schema.py
 * reads a different, non-existent path (specs/implementation/sqlite/schema.spec.md)
 * and targets different outputs, so there is no runnable regeneration pipeline
 * for this file today. Regenerating would not reproduce these migrations.
 *
 * SOURCE OF TRUTH for the schema pieces below are the shipped SQL files in
 * ./migrations/, which used to be dead weight: nothing read them at runtime, so a
 * fresh database never got cascades/sessions-indexes/ralph/commands upgrades.
 * They are now inlined as compiled JS so they reach the published tarball
 * (package.json "files" ships dist/ only - specs/**\/*.sql is NOT published).
 *
 * Coverage map (shipped file -> migration version):
 *   001_initial.sql   -> version 1 (initial_schema)
 *   002_events.sql    -> version 3 (cascade_support: cascade link indexes; the
 *                        cascade_id columns already exist since version 1)
 *   003_cascades.sql  -> version 3 (cascade_support)
 *   004_sessions.sql  -> version 4 (session_indexes)
 *   005_ralph.sql     -> version 5 (ralph_loop)
 *   006_locks.sql     -> version 6 (lock_indexes)
 *   007_commands.sql  -> version 7 (command_queue; the table itself predates it,
 *                        so only the additive columns/indexes apply)
 *   008_index.sql     -> version 8 (search_indexes)
 *
 * Note: version 2 (add_events_processed) predates the SQL files and is kept
 * as-is. Databases that already recorded versions 1 and 2 never re-run them and
 * receive 3..8 on the next initialize().
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrations = void 0;
exports.getCurrentVersion = getCurrentVersion;
exports.migrate = migrate;
exports.rollback = rollback;
/**
 * Migration version tracking
 */
const MIGRATION_TABLE = 'schema_migrations';
/**
 * Column names of a table, or an empty list when the table does not exist.
 */
function tableColumns(db, table) {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return new Set(rows.map((row) => row.name));
}
/**
 * ALTER TABLE has no IF NOT EXISTS, so additive column changes are guarded here.
 * Returns true when the column was added.
 */
function addColumnIfMissing(db, table, column, definition) {
    if (tableColumns(db, table).has(column)) {
        return false;
    }
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
    return true;
}
/**
 * Create an index only when both the table and every indexed column exist.
 * Keeps upgrades from pre-existing databases from failing on a shape that a
 * shipped SQL file assumed but this database never had.
 */
function createIndexIfColumns(db, table, columns, sql) {
    const present = tableColumns(db, table);
    if (columns.every((column) => present.has(column))) {
        db.exec(sql);
    }
}
/**
 * All migrations for the database
 */
const migrations = [
    {
        version: 1,
        name: 'initial_schema',
        up: (db) => {
            // Create schema_migrations table
            db.exec(`
        CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        );
      `);
            // Create specs table
            db.exec(`
        CREATE TABLE IF NOT EXISTS specs (
          file_path TEXT PRIMARY KEY,
          id TEXT,
          parent_id TEXT,
          children TEXT DEFAULT '[]',
          owner_session TEXT,
          depends_on TEXT DEFAULT '[]',
          tags TEXT DEFAULT '[]',
          short_desc TEXT,
          header_raw TEXT DEFAULT '',
          header_lines INTEGER DEFAULT 0,
          content_raw TEXT DEFAULT '',
          content_embedding BLOB,
          parsed_json TEXT,
          part INTEGER DEFAULT 1,
          total_parts INTEGER DEFAULT 1,
          last_edited INTEGER,
          git_commit TEXT
        );
      `);
            // Create indexes for specs table
            db.exec(`
        CREATE INDEX IF NOT EXISTS idx_specs_id ON specs(id);
        CREATE INDEX IF NOT EXISTS idx_specs_parent_id ON specs(parent_id);
        CREATE INDEX IF NOT EXISTS idx_specs_owner_session ON specs(owner_session);
        CREATE INDEX IF NOT EXISTS idx_specs_last_edited ON specs(last_edited);
      `);
            // Create sessions table
            db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          agent TEXT NOT NULL,
          owns TEXT DEFAULT '[]',
          status TEXT DEFAULT 'active',
          last_active INTEGER NOT NULL
        );
      `);
            // Create events table
            db.exec(`
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          kind TEXT NOT NULL,
          path TEXT,
          session TEXT,
          cascade_id TEXT,
          details TEXT
        );
      `);
            // Create indexes for events
            db.exec(`
        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
        CREATE INDEX IF NOT EXISTS idx_events_session ON events(session);
        CREATE INDEX IF NOT EXISTS idx_events_cascade_id ON events(cascade_id);
      `);
            // Create commands table
            db.exec(`
        CREATE TABLE IF NOT EXISTS commands (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          cascade_id TEXT,
          action TEXT NOT NULL,
          target TEXT,
          payload TEXT,
          status TEXT DEFAULT 'pending',
          created_at INTEGER NOT NULL
        );
      `);
            // Create indexes for commands
            db.exec(`
        CREATE INDEX IF NOT EXISTS idx_commands_session_id ON commands(session_id);
        CREATE INDEX IF NOT EXISTS idx_commands_cascade_id ON commands(cascade_id);
        CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
      `);
            // Create locks table
            db.exec(`
        CREATE TABLE IF NOT EXISTS locks (
          file_path TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          locked_at INTEGER NOT NULL,
          expires_at INTEGER
        );
      `);
            // Create recovery table
            db.exec(`
        CREATE TABLE IF NOT EXISTS recovery (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          operation TEXT NOT NULL,
          state TEXT NOT NULL,
          recovered INTEGER DEFAULT 0
        );
      `);
            // Create FTS5 virtual table for full-text search
            db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS specs_fts USING fts5(
          file_path,
          id,
          short_desc,
          header_raw,
          content_raw,
          content='specs',
          content_rowid='rowid'
        );
      `);
            // Create triggers to keep FTS in sync
            db.exec(`
        CREATE TRIGGER IF NOT EXISTS specs_ai AFTER INSERT ON specs BEGIN
          INSERT INTO specs_fts(rowid, file_path, id, short_desc, header_raw, content_raw)
          VALUES (NEW.rowid, NEW.file_path, NEW.id, NEW.short_desc, NEW.header_raw, NEW.content_raw);
        END;
      `);
            db.exec(`
        CREATE TRIGGER IF NOT EXISTS specs_ad AFTER DELETE ON specs BEGIN
          INSERT INTO specs_fts(specs_fts, rowid, file_path, id, short_desc, header_raw, content_raw)
          VALUES ('delete', OLD.rowid, OLD.file_path, OLD.id, OLD.short_desc, OLD.header_raw, OLD.content_raw);
        END;
      `);
            db.exec(`
        CREATE TRIGGER IF NOT EXISTS specs_au AFTER UPDATE ON specs BEGIN
          INSERT INTO specs_fts(specs_fts, rowid, file_path, id, short_desc, header_raw, content_raw)
          VALUES ('delete', OLD.rowid, OLD.file_path, OLD.id, OLD.short_desc, OLD.header_raw, OLD.content_raw);
          INSERT INTO specs_fts(rowid, file_path, id, short_desc, header_raw, content_raw)
          VALUES (NEW.rowid, NEW.file_path, NEW.id, NEW.short_desc, NEW.header_raw, NEW.content_raw);
        END;
      `);
        }
    },
    {
        version: 2,
        name: 'add_events_processed',
        up: (db) => {
            db.exec(`
        ALTER TABLE events ADD COLUMN processed INTEGER NOT NULL DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_events_processed_timestamp ON events(processed, timestamp);
      `);
        }
    },
    {
        // 002_events.sql + 003_cascades.sql. Every MCP cascade/dashboard/status tool
        // reads this table, so without it a fresh database answers
        // "SQLITE_ERROR: no such table: cascades" (HTTP 500).
        version: 3,
        name: 'cascade_support',
        up: (db) => {
            db.exec(`
        CREATE TABLE IF NOT EXISTS cascades (
          cascade_id TEXT PRIMARY KEY,
          depth INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          started_at INTEGER,
          converged_at INTEGER,
          root_trigger_file TEXT,
          root_trigger TEXT,
          created_at INTEGER
        );
      `);
            // Databases created before this migration may already hold a cascades
            // table without the columns the MCP tools write (specs/mcp.spec.dir/src/
            // tools/cascade.ts inserts root_trigger/created_at).
            addColumnIfMissing(db, 'cascades', 'root_trigger', 'TEXT');
            addColumnIfMissing(db, 'cascades', 'created_at', 'INTEGER');
            db.exec(`
        CREATE INDEX IF NOT EXISTS idx_cascades_status ON cascades(status);
        CREATE INDEX IF NOT EXISTS idx_cascades_started_at ON cascades(started_at);
        CREATE INDEX IF NOT EXISTS idx_cascades_converged_at ON cascades(converged_at);
        CREATE INDEX IF NOT EXISTS idx_cascades_root_trigger_file ON cascades(root_trigger_file);

        -- 002_events.sql: cascade link indexes (columns come from migration 1)
        CREATE INDEX IF NOT EXISTS idx_events_cascade_id ON events(cascade_id);
        CREATE INDEX IF NOT EXISTS idx_commands_cascade_id ON commands(cascade_id);
      `);
        }
    },
    {
        // 004_sessions.sql: the sessions table itself comes from migration 1, this
        // file adds the lookup indexes.
        version: 4,
        name: 'session_indexes',
        up: (db) => {
            db.exec(`
        CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent);
        CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
        CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);
      `);
        }
    },
    {
        // 005_ralph.sql: ralph loop tables.
        version: 5,
        name: 'ralph_loop',
        up: (db) => {
            db.exec(`
        CREATE TABLE IF NOT EXISTS ralph_tasks (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          depends_on TEXT,
          estimated_complexity TEXT,
          priority INTEGER DEFAULT 5,
          assigned_to TEXT,
          status TEXT DEFAULT 'pending',
          created_at INTEGER,
          started_at INTEGER,
          completed_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS steering_packets (
          id TEXT PRIMARY KEY,
          task_id TEXT,
          type TEXT,
          content TEXT,
          created_at INTEGER,
          processed_at INTEGER,
          FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
        );

        CREATE TABLE IF NOT EXISTS validation_results (
          id TEXT PRIMARY KEY,
          task_id TEXT,
          stage TEXT,
          passed INTEGER,
          details TEXT,
          created_at INTEGER,
          FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
        );

        CREATE INDEX IF NOT EXISTS idx_ralph_tasks_status ON ralph_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_ralph_tasks_priority ON ralph_tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_steering_packets_task_id ON steering_packets(task_id);
        CREATE INDEX IF NOT EXISTS idx_steering_packets_type ON steering_packets(type);
        CREATE INDEX IF NOT EXISTS idx_validation_results_task_id ON validation_results(task_id);
        CREATE INDEX IF NOT EXISTS idx_validation_results_stage ON validation_results(stage);
      `);
        }
    },
    {
        // 006_locks.sql: the locks table comes from migration 1, this file adds the
        // lookup indexes.
        version: 6,
        name: 'lock_indexes',
        up: (db) => {
            db.exec(`
        CREATE INDEX IF NOT EXISTS idx_locks_session_id ON locks(session_id);
        CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON locks(expires_at);
      `);
        }
    },
    {
        // 007_commands.sql: the shipped file declares a second, richer commands
        // shape. The table already exists since migration 1, so CREATE TABLE IF NOT
        // EXISTS in that file is a no-op and its primary key / CHECK(status) can no
        // longer be applied. What is applied here is the additive part: the extra
        // columns and the command-queue indexes.
        version: 7,
        name: 'command_queue',
        up: (db) => {
            addColumnIfMissing(db, 'commands', 'target_file', 'TEXT');
            addColumnIfMissing(db, 'commands', 'priority', 'INTEGER DEFAULT 0');
            addColumnIfMissing(db, 'commands', 'error', 'TEXT');
            addColumnIfMissing(db, 'commands', 'updated_at', 'INTEGER');
            createIndexIfColumns(db, 'commands', ['status'], `CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);`);
            createIndexIfColumns(db, 'commands', ['cascade_id'], `CREATE INDEX IF NOT EXISTS idx_commands_cascade ON commands(cascade_id);`);
            createIndexIfColumns(db, 'commands', ['priority', 'created_at'], `CREATE INDEX IF NOT EXISTS idx_commands_priority ON commands(priority DESC, created_at ASC);`);
            createIndexIfColumns(db, 'commands', ['session_id'], `CREATE INDEX IF NOT EXISTS idx_commands_session ON commands(session_id);`);
            createIndexIfColumns(db, 'commands', ['updated_at'], `CREATE INDEX IF NOT EXISTS idx_commands_updated ON commands(updated_at);`);
        }
    },
    {
        // 008_index.sql + the indexes 001_initial.sql declared but migration 1 (the
        // generated one) never created: notably `specs.refs`, which the rest of the
        // code base queries and which the schema spec documents.
        version: 8,
        name: 'search_indexes',
        up: (db) => {
            addColumnIfMissing(db, 'specs', 'refs', `TEXT DEFAULT '[]'`);
            createIndexIfColumns(db, 'specs', ['tags'], `CREATE INDEX IF NOT EXISTS idx_specs_tags ON specs(tags);`);
            createIndexIfColumns(db, 'specs', ['depends_on'], `CREATE INDEX IF NOT EXISTS idx_specs_depends_on ON specs(depends_on);`);
            createIndexIfColumns(db, 'specs', ['refs'], `CREATE INDEX IF NOT EXISTS idx_specs_refs ON specs(refs);`);
            createIndexIfColumns(db, 'commands', ['target'], `CREATE INDEX IF NOT EXISTS idx_commands_target ON commands(target);`);
            createIndexIfColumns(db, 'events', ['path'], `CREATE INDEX IF NOT EXISTS idx_events_path ON events(path);`);
        }
    }
];
exports.migrations = migrations;
/**
 * Get the current migration version
 */
function getCurrentVersion(db) {
    try {
        const row = db.prepare(`SELECT MAX(version) as version FROM ${MIGRATION_TABLE}`).get();
        return row.version || 0;
    }
    catch {
        // Table doesn't exist yet
        return 0;
    }
}
/**
 * Run all pending migrations
 */
function migrate(db) {
    const currentVersion = getCurrentVersion(db);
    let applied = 0;
    for (const migration of migrations) {
        if (migration.version > currentVersion) {
            console.log(`Applying migration ${migration.version}: ${migration.name}`);
            migration.up(db);
            // Record migration
            db.prepare(`INSERT INTO ${MIGRATION_TABLE} (version, name, applied_at) VALUES (?, ?, ?)`).run(migration.version, migration.name, Date.now());
            applied++;
        }
    }
    return {
        applied,
        currentVersion: getCurrentVersion(db)
    };
}
/**
 * Rollback to a specific version
 */
function rollback(db, targetVersion) {
    const currentVersion = getCurrentVersion(db);
    if (targetVersion >= currentVersion) {
        console.log('Nothing to rollback');
        return false;
    }
    // Find migrations to rollback (in reverse order)
    const toRollback = migrations
        .filter(m => m.version > targetVersion)
        .sort((a, b) => b.version - a.version);
    for (const migration of toRollback) {
        if (migration.down) {
            console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
            migration.down(db);
        }
        // Remove migration record
        db.prepare(`DELETE FROM ${MIGRATION_TABLE} WHERE version = ?`).run(migration.version);
    }
    return true;
}
//# sourceMappingURL=migrations.js.map