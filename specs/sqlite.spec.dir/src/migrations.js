"use strict";
/**
 * SPECLANG-GENERATED: Database migration system
 * Source: @speclang/sqlite @block:sqlite/schema
 *
 * NOTE ON GENERATION: the SQL bodies in this module are GENERATED, not hand-copied. The
 * eight shipped SQL files in ./migrations/ are the SOURCE OF TRUTH; `npm run gen:migrations`
 * (scripts/gen-migrations.mjs) parses them and rewrites the GEN-MIGRATIONS block below, and
 * `npm run gen:migrations -- --check` exits non-zero, naming the stale file, when a .sql
 * changed and this module was not regenerated. Edit the .sql files, then regenerate — never
 * hand-edit the generated block.
 *
 * Why generated: this file used to inline hand-copied JavaScript of the same schema, so any
 * edit to a .sql file silently diverged from what the runtime actually executes. Those files
 * were also dead weight at runtime (nothing read them), so a fresh database never got the
 * cascades / sessions-indexes / ralph / commands upgrades. The SQL is emitted as a compiled
 * TypeScript module because the published tarball ships dist/ only — the runtime must never
 * read a .sql file from disk.
 *
 * The generator also carries the JS-side steps that the files alone cannot express: an
 * ALTER TABLE ADD COLUMN guard for tables that predate the file (cascades.root_trigger /
 * created_at in version 3, the commands queue columns in version 7, specs.refs in version 8),
 * and every CREATE INDEX runs through createIndexIfColumns() so an upgrade of an existing
 * database cannot fail on a shape the shipped DDL assumed but that database never had.
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
 * Note: version 2 (add_events_processed) predates the SQL files and is kept as-is.
 * Databases that already recorded versions 1 and 2 never re-run them and
 * receive 3..8 on the next initialize().
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrations = void 0;
exports.getCurrentVersion = getCurrentVersion;
exports.migrate = migrate;
exports.rollback = rollback;
/** file name -> statements, in file order. Consumed by applySqlFile() below. */
const GENERATED_SQL = {
    '001_initial.sql': [
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);`,
        },
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS specs (
  file_path TEXT PRIMARY KEY,
  id TEXT,
  parent_id TEXT,
  children TEXT DEFAULT '[]',
  owner_session TEXT,
  depends_on TEXT DEFAULT '[]',
  refs TEXT DEFAULT '[]',
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
);`,
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_specs_id ON specs(id);`,
            index: { name: 'idx_specs_id', table: 'specs', columns: ['id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_specs_parent_id ON specs(parent_id);`,
            index: { name: 'idx_specs_parent_id', table: 'specs', columns: ['parent_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_specs_owner_session ON specs(owner_session);`,
            index: { name: 'idx_specs_owner_session', table: 'specs', columns: ['owner_session'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_specs_last_edited ON specs(last_edited);`,
            index: { name: 'idx_specs_last_edited', table: 'specs', columns: ['last_edited'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_specs_tags ON specs(tags);`,
            index: { name: 'idx_specs_tags', table: 'specs', columns: ['tags'] },
        },
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  agent TEXT NOT NULL,
  owns TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active',
  last_active INTEGER NOT NULL
);`,
        },
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  kind TEXT NOT NULL,
  path TEXT,
  session TEXT,
  cascade_id TEXT,
  details TEXT
);`,
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);`,
            index: { name: 'idx_events_timestamp', table: 'events', columns: ['timestamp'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);`,
            index: { name: 'idx_events_kind', table: 'events', columns: ['kind'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_events_session ON events(session);`,
            index: { name: 'idx_events_session', table: 'events', columns: ['session'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_events_cascade_id ON events(cascade_id);`,
            index: { name: 'idx_events_cascade_id', table: 'events', columns: ['cascade_id'] },
        },
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  cascade_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  payload TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL
);`,
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_session_id ON commands(session_id);`,
            index: { name: 'idx_commands_session_id', table: 'commands', columns: ['session_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_cascade_id ON commands(cascade_id);`,
            index: { name: 'idx_commands_cascade_id', table: 'commands', columns: ['cascade_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);`,
            index: { name: 'idx_commands_status', table: 'commands', columns: ['status'] },
        },
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS locks (
  file_path TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  locked_at INTEGER NOT NULL,
  expires_at INTEGER
);`,
        },
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS recovery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL,
  recovered INTEGER DEFAULT 0
);`,
        },
        {
            kind: 'virtual_table',
            sql: `CREATE VIRTUAL TABLE IF NOT EXISTS specs_fts USING fts5(
  file_path,
  id,
  short_desc,
  header_raw,
  content_raw,
  content='specs',
  content_rowid='rowid'
);`,
        },
        {
            kind: 'trigger',
            sql: `CREATE TRIGGER IF NOT EXISTS specs_ai AFTER INSERT ON specs BEGIN
  INSERT INTO specs_fts(rowid, file_path, id, short_desc, header_raw, content_raw)
  VALUES (NEW.rowid, NEW.file_path, NEW.id, NEW.short_desc, NEW.header_raw, NEW.content_raw);
END;`,
        },
        {
            kind: 'trigger',
            sql: `CREATE TRIGGER IF NOT EXISTS specs_ad AFTER DELETE ON specs BEGIN
  INSERT INTO specs_fts(specs_fts, rowid, file_path, id, short_desc, header_raw, content_raw)
  VALUES ('delete', OLD.rowid, OLD.file_path, OLD.id, OLD.short_desc, OLD.header_raw, OLD.content_raw);
END;`,
        },
        {
            kind: 'trigger',
            sql: `CREATE TRIGGER IF NOT EXISTS specs_au AFTER UPDATE ON specs BEGIN
  INSERT INTO specs_fts(specs_fts, rowid, file_path, id, short_desc, header_raw, content_raw)
  VALUES ('delete', OLD.rowid, OLD.file_path, OLD.id, OLD.short_desc, OLD.header_raw, OLD.content_raw);
  INSERT INTO specs_fts(rowid, file_path, id, short_desc, header_raw, content_raw)
  VALUES (NEW.rowid, NEW.file_path, NEW.id, NEW.short_desc, NEW.header_raw, NEW.content_raw);
END;`,
        },
    ],
    '002_events.sql': [
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_events_cascade_id ON events(cascade_id);`,
            index: { name: 'idx_events_cascade_id', table: 'events', columns: ['cascade_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_cascade_id ON commands(cascade_id);`,
            index: { name: 'idx_commands_cascade_id', table: 'commands', columns: ['cascade_id'] },
        },
    ],
    '003_cascades.sql': [
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS cascades (
  cascade_id TEXT PRIMARY KEY,
  depth INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  started_at INTEGER,
  created_at INTEGER,
  converged_at INTEGER,
  root_trigger TEXT,
  root_trigger_file TEXT
);`,
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_cascades_status ON cascades(status);`,
            index: { name: 'idx_cascades_status', table: 'cascades', columns: ['status'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_cascades_started_at ON cascades(started_at);`,
            index: { name: 'idx_cascades_started_at', table: 'cascades', columns: ['started_at'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_cascades_converged_at ON cascades(converged_at);`,
            index: { name: 'idx_cascades_converged_at', table: 'cascades', columns: ['converged_at'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_cascades_root_trigger_file ON cascades(root_trigger_file);`,
            index: { name: 'idx_cascades_root_trigger_file', table: 'cascades', columns: ['root_trigger_file'] },
        },
    ],
    '004_sessions.sql': [
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent);`,
            index: { name: 'idx_sessions_agent', table: 'sessions', columns: ['agent'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);`,
            index: { name: 'idx_sessions_status', table: 'sessions', columns: ['status'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);`,
            index: { name: 'idx_sessions_last_active', table: 'sessions', columns: ['last_active'] },
        },
    ],
    '005_ralph.sql': [
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS ralph_tasks (
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
);`,
        },
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS steering_packets (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  type TEXT,
  content TEXT,
  created_at INTEGER,
  processed_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
);`,
        },
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS validation_results (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  stage TEXT,
  passed INTEGER,
  details TEXT,
  created_at INTEGER,
  FOREIGN KEY (task_id) REFERENCES ralph_tasks(id)
);`,
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_ralph_tasks_status ON ralph_tasks(status);`,
            index: { name: 'idx_ralph_tasks_status', table: 'ralph_tasks', columns: ['status'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_ralph_tasks_priority ON ralph_tasks(priority);`,
            index: { name: 'idx_ralph_tasks_priority', table: 'ralph_tasks', columns: ['priority'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_steering_packets_task_id ON steering_packets(task_id);`,
            index: { name: 'idx_steering_packets_task_id', table: 'steering_packets', columns: ['task_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_steering_packets_type ON steering_packets(type);`,
            index: { name: 'idx_steering_packets_type', table: 'steering_packets', columns: ['type'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_validation_results_task_id ON validation_results(task_id);`,
            index: { name: 'idx_validation_results_task_id', table: 'validation_results', columns: ['task_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_validation_results_stage ON validation_results(stage);`,
            index: { name: 'idx_validation_results_stage', table: 'validation_results', columns: ['stage'] },
        },
    ],
    '006_locks.sql': [
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_locks_session_id ON locks(session_id);`,
            index: { name: 'idx_locks_session_id', table: 'locks', columns: ['session_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON locks(expires_at);`,
            index: { name: 'idx_locks_expires_at', table: 'locks', columns: ['expires_at'] },
        },
    ],
    '007_commands.sql': [
        {
            kind: 'table',
            sql: `CREATE TABLE IF NOT EXISTS commands (
    command_id TEXT PRIMARY KEY,
    cascade_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_file TEXT,
    session_id TEXT,
    payload TEXT,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
    error TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);`,
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);`,
            index: { name: 'idx_commands_status', table: 'commands', columns: ['status'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_cascade ON commands(cascade_id);`,
            index: { name: 'idx_commands_cascade', table: 'commands', columns: ['cascade_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_priority ON commands(priority DESC, created_at ASC);`,
            index: { name: 'idx_commands_priority', table: 'commands', columns: ['priority', 'created_at'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_session ON commands(session_id);`,
            index: { name: 'idx_commands_session', table: 'commands', columns: ['session_id'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_updated ON commands(updated_at);`,
            index: { name: 'idx_commands_updated', table: 'commands', columns: ['updated_at'] },
        },
    ],
    '008_index.sql': [
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_specs_depends_on ON specs(depends_on);`,
            index: { name: 'idx_specs_depends_on', table: 'specs', columns: ['depends_on'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_specs_refs ON specs(refs);`,
            index: { name: 'idx_specs_refs', table: 'specs', columns: ['refs'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_commands_target ON commands(target);`,
            index: { name: 'idx_commands_target', table: 'commands', columns: ['target'] },
        },
        {
            kind: 'index',
            sql: `CREATE INDEX IF NOT EXISTS idx_events_path ON events(path);`,
            index: { name: 'idx_events_path', table: 'events', columns: ['path'] },
        },
    ],
};
/* <<< GEN-MIGRATIONS:END */
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
 * Execute one shipped SQL file, in file order.
 *
 * Index statements are deferred until every other statement of the file has run and, when
 * given, `beforeIndexes` has run: that is what lets a guarded ADD COLUMN land before the
 * index that depends on it (a legacy `cascades` table without root_trigger, for example).
 */
function applySqlFile(db, file, options = {}) {
    const statements = GENERATED_SQL[file];
    if (!statements) {
        throw new Error(`No generated SQL for ${file}; run \`npm run gen:migrations\` to regenerate migrations.ts.`);
    }
    const indexes = [];
    for (const statement of statements) {
        if (statement.index) {
            indexes.push(statement);
            continue;
        }
        db.exec(statement.sql);
    }
    if (options.beforeIndexes) {
        options.beforeIndexes();
    }
    for (const statement of indexes) {
        const index = statement.index;
        createIndexIfColumns(db, index.table, index.columns, statement.sql);
    }
}
/**
 * All migrations for the database
 */
const migrations = [
    {
        // 001_initial.sql: tables, FTS virtual table + sync triggers, and the first indexes.
        version: 1,
        name: 'initial_schema',
        up: (db) => {
            applySqlFile(db, '001_initial.sql');
        }
    },
    {
        // Predates the shipped SQL files: the events.processed column is not in any of them.
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
        // 003_cascades.sql + 002_events.sql. Every MCP cascade/dashboard/status tool
        // reads this table, so without it a fresh database answers
        // "SQLITE_ERROR: no such table: cascades" (HTTP 500).
        version: 3,
        name: 'cascade_support',
        up: (db) => {
            applySqlFile(db, '003_cascades.sql', {
                // Databases created before this migration may already hold a cascades
                // table without the columns the MCP tools write (specs/mcp.spec.dir/src/
                // tools/cascade.ts inserts root_trigger/created_at). CREATE TABLE IF NOT
                // EXISTS cannot widen an existing table, so add them before the indexes.
                beforeIndexes: () => {
                    addColumnIfMissing(db, 'cascades', 'root_trigger', 'TEXT');
                    addColumnIfMissing(db, 'cascades', 'created_at', 'INTEGER');
                }
            });
            // 002_events.sql: cascade link indexes (columns come from migration 1).
            applySqlFile(db, '002_events.sql');
        }
    },
    {
        // 004_sessions.sql: the sessions table itself comes from migration 1, this
        // file adds the lookup indexes.
        version: 4,
        name: 'session_indexes',
        up: (db) => {
            applySqlFile(db, '004_sessions.sql');
        }
    },
    {
        // 005_ralph.sql: ralph loop tables.
        version: 5,
        name: 'ralph_loop',
        up: (db) => {
            applySqlFile(db, '005_ralph.sql');
        }
    },
    {
        // 006_locks.sql: the locks table comes from migration 1, this file adds the
        // lookup indexes.
        version: 6,
        name: 'lock_indexes',
        up: (db) => {
            applySqlFile(db, '006_locks.sql');
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
            applySqlFile(db, '007_commands.sql', {
                beforeIndexes: () => {
                    addColumnIfMissing(db, 'commands', 'target_file', 'TEXT');
                    addColumnIfMissing(db, 'commands', 'priority', 'INTEGER DEFAULT 0');
                    addColumnIfMissing(db, 'commands', 'error', 'TEXT');
                    addColumnIfMissing(db, 'commands', 'updated_at', 'INTEGER');
                }
            });
        }
    },
    {
        // 008_index.sql + the indexes 001_initial.sql declared. `specs.refs` is part
        // of the shipped 001 DDL, so a database created by this module now has it from
        // version 1; the guard keeps databases created by the old hand-written version
        // 1 (which omitted the column) upgradeable.
        version: 8,
        name: 'search_indexes',
        up: (db) => {
            applySqlFile(db, '008_index.sql', {
                beforeIndexes: () => {
                    addColumnIfMissing(db, 'specs', 'refs', `TEXT DEFAULT '[]'`);
                }
            });
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