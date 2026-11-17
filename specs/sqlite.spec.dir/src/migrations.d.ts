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
import { type Database as DatabaseType } from 'better-sqlite3';
import type { Migration } from './types.js';
/**
 * All migrations for the database
 */
declare const migrations: Migration[];
/**
 * Get the current migration version
 */
export declare function getCurrentVersion(db: DatabaseType): number;
/**
 * Run all pending migrations
 */
export declare function migrate(db: DatabaseType): {
    applied: number;
    currentVersion: number;
};
/**
 * Rollback to a specific version
 */
export declare function rollback(db: DatabaseType, targetVersion: number): boolean;
export { migrations };
//# sourceMappingURL=migrations.d.ts.map