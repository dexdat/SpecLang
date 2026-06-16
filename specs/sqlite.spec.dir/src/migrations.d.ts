/**
 * SPECLANG-GENERATED: Database migration system
 * Source: @speclang/sqlite @block:sqlite/schema
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