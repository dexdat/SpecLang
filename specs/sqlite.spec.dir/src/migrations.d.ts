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