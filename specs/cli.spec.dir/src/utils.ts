/**
 * SPECLANG-GENERATED: CLI utilities
 * Source: @speclang/mcp.cli
 * 
 * Common utilities for CLI commands
 */

import * as path from 'path';
import * as fs from 'fs';
import { SpecLangDB, createDatabase } from '../db/index.js';
import { generateIndex, SpecIndex, getSpecFiles } from '../indexer/index.js';
import { validateAllSpecs, findSpecFiles, loadSpecIndex } from '../parser/index.js';

/**
 * Whether to suppress console output (for JSON mode)
 */
let suppressOutput = false;

/**
 * Set suppress output mode
 */
export function setSuppressOutput(suppress: boolean): void {
  suppressOutput = suppress;
}

/**
 * Get suppress output state
 */
export function isSuppressOutput(): boolean {
  return suppressOutput;
}

/**
 * Console.log wrapper that respects suppress mode
 */
export function log(...args: unknown[]): void {
  if (!suppressOutput) {
    console.log(...args);
  }
}

/**
 * Console.error wrapper that respects suppress mode
 */
export function error(...args: unknown[]): void {
  if (!suppressOutput) {
    console.error(...args);
  }
}

/**
 * Database instance (singleton)
 */
let dbInstance: SpecLangDB | null = null;

/**
 * Get database instance
 */
export function getDatabase(config?: { path?: string }): SpecLangDB {
  if (!dbInstance) {
    const dbPath = config?.path || process.env.SPECLANG_DB || '.speclang/speclang.db';
    dbInstance = createDatabase({ path: dbPath });
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Get specs directory
 */
export function getSpecsDir(): string {
  return process.env.SPECLANG_DIR || 'specs';
}

/**
 * Load spec index
 */
export function loadIndex(): SpecIndex {
  const indexPath = '.speclang/_index.json';
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(content) as SpecIndex;
  }
  // Generate if not exists
  return generateIndex({ rootDir: getSpecsDir() });
}

/**
 * Refresh spec index
 */
export function refreshIndex(): SpecIndex {
  const db = getDatabase();
  const index = generateIndex({ 
    rootDir: getSpecsDir(),
    outputPath: '.speclang/_index.json'
  });
  
  // Populate database
  const { populateDatabase } = require('../indexer/index.js');
  populateDatabase(index, db);
  
  return index;
}

/**
 * Find spec file by ID
 */
export function findSpecFile(specId: string): string | null {
  const index = loadIndex();
  const entry = index.specs[specId];
  if (entry) {
    return entry.file;
  }
  return null;
}

/**
 * Read spec content from file
 */
export function readSpecContent(filePath: string): string {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(getSpecsDir(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Spec file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Output result in various formats
 */
export interface OutputOptions {
  json?: boolean;
  quiet?: boolean;
}

export function outputResults<T>(
  results: T[],
  options: OutputOptions,
  formatFn?: (item: T) => string
): void {
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else if (options.quiet) {
    results.forEach(r => {
      if (formatFn) {
        console.log(formatFn(r));
      } else {
        console.log(JSON.stringify(r));
      }
    });
  } else {
    results.forEach(r => {
      if (formatFn) {
        console.log(formatFn(r));
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
    });
  }
}

/**
 * Format spec for display
 */
export function formatSpec(item: { id?: string; short?: string; layer?: number; version?: string }): string {
  return `  ${item.id} (layer ${item.layer}) - ${item.short || ''}`;
}

/**
 * Get database path
 */
export function getDbPath(): string {
  return process.env.SPECLANG_DB || '.speclang/speclang.db';
}

/**
 * Ensure .speclang directory exists
 */
export function ensureSpeclangDir(): void {
  const dir = '.speclang';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
