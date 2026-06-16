---
id: "@sortix/test"
version: 1.0.0
layer: 3
target_lang: ts
owned-by: sortix
tags: [sortix, test, vitest]
short: "Sortix — Integration tests for the CLI tool"
depends_on:
  - "@ref:@sortix/master"
  - "@ref:@sortix/cli"
status: draft
---

# Sortix — Test Spec

## Overview

Integration tests for Sortix. Tests cover:
- Directory scanning
- File categorization by extension
- Dry-run organization (no files harmed!)
- CLI command parsing

### @block:test-suite @kind:implementation

Test suite using Node's built-in test runner (or vitest-like patterns).

## Implementation

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Import the module directly — the assembler resolves this
import {
  scanDirectory,
  categorizeFile,
  organizeFiles,
  printSummary,
  FileEntry,
  Category,
  ScanResult,
  OrganizeResult,
} from './sortix.spec';
import { program } from './sortix-cli.spec';

// ── Helpers ─────────────────────────────────────────────────────

let testDir: string;

function makeTestDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sortix-test-'));
  return dir;
}

function createTestFile(dir: string, name: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, `Test content for ${name}`);
  return filePath;
}

// ── Tests ───────────────────────────────────────────────────────

describe('Sortix Core Library', () => {
  beforeAll(() => {
    testDir = makeTestDir();
    // Create test files of various types
    createTestFile(testDir, 'photo.jpg');
    createTestFile(testDir, 'screenshot.png');
    createTestFile(testDir, 'document.pdf');
    createTestFile(testDir, 'notes.txt');
    createTestFile(testDir, 'readme.md');
    createTestFile(testDir, 'main.ts');
    createTestFile(testDir, 'styles.css');
    createTestFile(testDir, 'package.json');
    createTestFile(testDir, 'archive.zip');
    createTestFile(testDir, 'song.mp3');
    createTestFile(testDir, 'video.mp4');
    createTestFile(testDir, 'unknown.xyz');
  });

  afterAll(() => {
    // Clean up
    if (testDir) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  // ── scanDirectory ───────────────────────────────────────────

  describe('scanDirectory', () => {
    it('should find all files in a directory', () => {
      const result = scanDirectory(testDir);
      expect(result.totalFiles).toBe(12);
      expect(result.entries.length).toBe(12);
    });

    it('should include file extension and size', () => {
      const result = scanDirectory(testDir);
      const jpg = result.entries.find(e => e.name === 'photo.jpg');
      expect(jpg).toBeDefined();
      expect(jpg!.ext).toBe('.jpg');
      expect(jpg!.size).toBeGreaterThan(0);
    });

    it('should handle non-existent directories gracefully', () => {
      const result = scanDirectory('/nonexistent/directory');
      expect(result.totalFiles).toBe(0);
      expect(result.entries).toEqual([]);
    });
  });

  // ── categorizeFile ───────────────────────────────────────────

  describe('categorizeFile', () => {
    const testCases: [string, string, Category][] = [
      ['photo.jpg', '.jpg', 'images'],
      ['screenshot.png', '.png', 'images'],
      ['document.pdf', '.pdf', 'docs'],
      ['notes.txt', '.txt', 'docs'],
      ['main.ts', '.ts', 'code'],
      ['styles.css', '.css', 'code'],
      ['package.json', '.json', 'code'],
      ['archive.zip', '.zip', 'archives'],
      ['song.mp3', '.mp3', 'audio'],
      ['video.mp4', '.mp4', 'video'],
      ['unknown.xyz', '.xyz', 'other'],
    ];

    for (const [name, ext, expected] of testCases) {
      it(`should categorize ${ext} files as ${expected}`, () => {
        const entry: FileEntry = {
          filePath: `/fake/${name}`,
          name,
          ext,
          size: 100,
        };
        expect(categorizeFile(entry)).toBe(expected);
      });
    }
  });

  // ── organizeFiles (dry-run) ──────────────────────────────────

  describe('organizeFiles (dry-run)', () => {
    it('should report moved files without actually moving them', () => {
      const result = scanDirectory(testDir);
      const orgResults = organizeFiles(result.entries, {
        dryRun: true,
        targetDir: testDir,
      });

      // All 12 files should be accounted for
      const totalMoved = Object.values(orgResults).reduce((sum, r) => sum + r.moved, 0);
      expect(totalMoved).toBe(12);

      // Files should still be in original location
      expect(fs.existsSync(path.join(testDir, 'photo.jpg'))).toBe(true);
    });

    it('should categorize correctly in results', () => {
      const result = scanDirectory(testDir);
      const orgResults = organizeFiles(result.entries, {
        dryRun: true,
        targetDir: testDir,
      });

      expect(orgResults.images.moved).toBe(2);  // jpg, png
      expect(orgResults.docs.moved).toBe(3);    // pdf, txt, md
      expect(orgResults.code.moved).toBe(3);    // ts, css, json
      expect(orgResults.archives.moved).toBe(1); // zip
      expect(orgResults.audio.moved).toBe(1);   // mp3
      expect(orgResults.video.moved).toBe(1);   // mp4
      expect(orgResults.other.moved).toBe(1);   // xyz
    });
  });

  // ── organizeFiles (real) ────────────────────────────────────

  describe('organizeFiles (real)', () => {
    let orgDir: string;

    beforeAll(() => {
      orgDir = makeTestDir();
      createTestFile(orgDir, 'doc.pdf');
      createTestFile(orgDir, 'script.js');
      createTestFile(orgDir, 'image.webp');
    });

    afterAll(() => {
      if (orgDir) {
        fs.rmSync(orgDir, { recursive: true, force: true });
      }
    });

    it('should move files into categorized subdirectories', () => {
      const result = scanDirectory(orgDir);
      organizeFiles(result.entries, { dryRun: false, targetDir: orgDir });

      expect(fs.existsSync(path.join(orgDir, 'docs', 'doc.pdf'))).toBe(true);
      expect(fs.existsSync(path.join(orgDir, 'code', 'script.js'))).toBe(true);
      expect(fs.existsSync(path.join(orgDir, 'images', 'image.webp'))).toBe(true);

      // Original files should no longer exist
      expect(fs.existsSync(path.join(orgDir, 'doc.pdf'))).toBe(false);
    });
  });

  // ── printSummary ────────────────────────────────────────────

  describe('printSummary', () => {
    it('should print summary without error', () => {
      const results: Record<Category, OrganizeResult> = {
        images: { category: 'images', moved: 3, failed: 0, totalSize: 1024000 },
        docs: { category: 'docs', moved: 5, failed: 1, totalSize: 2048000 },
        code: { category: 'code', moved: 2, failed: 0, totalSize: 512000 },
        archives: { category: 'archives', moved: 0, failed: 0, totalSize: 0 },
        audio: { category: 'audio', moved: 1, failed: 0, totalSize: 8192000 },
        video: { category: 'video', moved: 0, failed: 0, totalSize: 0 },
        other: { category: 'other', moved: 0, failed: 0, totalSize: 0 },
      };
      expect(() => printSummary(results)).not.toThrow();
    });
  });
});

describe('Sortix CLI', () => {
  it('should parse scan command', () => {
    const cmd = program.commands.find(c => c.name() === 'scan');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toContain('Scan');
  });

  it('should parse organize command', () => {
    const cmd = program.commands.find(c => c.name() === 'organize');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toContain('Organize');
  });
});
```
