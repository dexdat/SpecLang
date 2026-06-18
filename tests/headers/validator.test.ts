import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { validateHeaders } from '../../src/parser/header-validator';

function findAllSpecFiles(): string[] {
  function walk(dir: string): string[] {
    const files: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...walk(fullPath));
        } else if (
          entry.name.endsWith('.spec.md') ||
          entry.name.endsWith('.scl')
        ) {
          files.push(fullPath);
        }
      }
    } catch {
      // skip inaccessible directories
    }
    return files;
  }
  return walk('specs');
}

describe('Universal Header Validator', () => {
  const allSpecFiles = findAllSpecFiles();

  it('should find spec files', () => {
    expect(allSpecFiles.length).toBeGreaterThan(0);
    console.log(`Found ${allSpecFiles.length} spec files`);
  });

  it('should validate all spec headers', () => {
    const result = validateHeaders(allSpecFiles);

    console.log(`\n=== Validation Summary ===`);
    console.log(`Total:  ${result.total}`);
    console.log(`Valid:  ${result.valid}`);
    console.log(`Invalid: ${result.invalid}`);
    console.log(`Pass rate: ${result.total > 0 ? ((result.valid / result.total) * 100).toFixed(1) : 'N/A'}%`);

    if (result.invalid > 0) {
      console.log(`\n=== Invalid Specs ===`);
      for (const r of result.results) {
        if (!r.valid) {
          const relPath = path.relative(process.cwd(), r.filepath || '');
          console.log(`\n[INVALID] ${relPath}`);
          for (const err of r.errors) {
            console.log(`  ERROR ${err.code}: ${err.message}`);
          }
          for (const warn of r.warnings) {
            console.log(`  WARN  ${warn.code}: ${warn.message}`);
          }
        }
      }
    }

    expect(result.total).toBe(allSpecFiles.length);
    expect(result.valid + result.invalid).toBe(result.total);
    expect(result.valid).toBeGreaterThan(0);
  });

  it('should report validation summary', () => {
    const result = validateHeaders(allSpecFiles);

    const passRate = result.total > 0
      ? ((result.valid / result.total) * 100).toFixed(1)
      : '0.0';

    console.log(`\n=== Validation Summary ===`);
    console.log(`Total:  ${result.total}`);
    console.log(`Valid:  ${result.valid}`);
    console.log(`Invalid: ${result.invalid}`);
    console.log(`Pass rate: ${passRate}%`);

    expect(result.total).toBe(allSpecFiles.length);
    expect(result.valid + result.invalid).toBe(result.total);
  });

  it('should report error codes for invalid headers', () => {
    const result = validateHeaders(allSpecFiles);
    const allCodes = new Set<string>();
    for (const r of result.results) {
      for (const err of r.errors) {
        allCodes.add(err.code);
      }
    }
    expect(allCodes.has('E020')).toBe(true);
    expect(allCodes.has('E002')).toBe(true);
    expect(allCodes.size).toBeGreaterThanOrEqual(2);
  });
});
