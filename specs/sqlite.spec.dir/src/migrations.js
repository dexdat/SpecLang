"use strict";
/**
 * SPECLANG-GENERATED: Database migration system
 * Source: @speclang/sqlite @block:sqlite/schema
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