/**
 * Tests for SpecLang LSP reference resolver.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseReferences,
  resolveFileRef,
  findBlockInFile,
  resolveReference,
  _resetCache,
} from '../../src/lsp/references.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('parseReferences', () => {
  it('extracts simple file reference', () => {
    const refs = parseReferences('See @ref:specs/core for details.');
    expect(refs).toHaveLength(1);
    expect(refs[0].refId).toBe('specs/core');
    expect(refs[0].block).toBeUndefined();
    expect(refs[0].line).toBe(0);
  });

  it('extracts block reference', () => {
    const refs = parseReferences('See @ref:specs/core#my-block for details.');
    expect(refs).toHaveLength(1);
    expect(refs[0].refId).toBe('specs/core');
    expect(refs[0].block).toBe('my-block');
  });

  it('extracts multiple references on different lines', () => {
    const text = 'Line 0: @ref:specs/foo\nLine 1: @ref:specs/bar\nLine 2: @ref:specs/baz#block3';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(3);
    expect(refs[0].refId).toBe('specs/foo');
    expect(refs[0].line).toBe(0);
    expect(refs[1].refId).toBe('specs/bar');
    expect(refs[1].line).toBe(1);
    expect(refs[2].refId).toBe('specs/baz');
    expect(refs[2].block).toBe('block3');
    expect(refs[2].line).toBe(2);
  });

  it('returns correct character positions', () => {
    const text = 'prefix @ref:specs/core suffix';
    const refs = parseReferences(text);
    expect(refs[0].startChar).toBe(7); // position of '@'
    expect(refs[0].endChar).toBe(22);  // position after 'core'
    expect(refs[0].fullMatch).toBe('@ref:specs/core');
  });

  it('returns empty array when no references found', () => {
    const refs = parseReferences('No refs here.');
    expect(refs).toHaveLength(0);
  });

  it('matches references with hyphens in path', () => {
    const refs = parseReferences('@ref:specs/core.spec.dir/entities');
    expect(refs).toHaveLength(1);
    expect(refs[0].refId).toBe('specs/core.spec.dir/entities');
  });
});

describe('resolveFileRef', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-lsp-test-'));
    _resetCache();
  });

  it('resolves spec file that exists', () => {
    const specDir = path.join(tmpDir, 'specs');
    const specFile = path.join(specDir, 'test.spec.md');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(specFile, '# test');

    const result = resolveFileRef('specs/test', tmpDir);
    expect(result).toBe(specFile);
  });

  it('resolves short names', () => {
    const docDir = path.join(tmpDir, 'docs');
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, 'NORTH_STAR.md'), '# North Star');

    const result = resolveFileRef('northstar', tmpDir);
    expect(result).toBe(path.join(docDir, 'NORTH_STAR.md'));
  });

  it('returns null for nonexistent file', () => {
    const result = resolveFileRef('specs/nonexistent', tmpDir);
    expect(result).toBeNull();
  });

  it('resolves via _index.json when direct file not found', () => {
    const specDir = path.join(tmpDir, 'specs');
    const specFile = path.join(specDir, 'core.spec.md');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(specFile, '# core');

    const indexData = {
      specs: {
        '@specs/core': { file: 'specs/core.spec.md', id: '@specs/core' },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '_index.json'), JSON.stringify(indexData));

    const result = resolveFileRef('specs/core', tmpDir);
    expect(result).toBe(specFile);
  });
});

describe('findBlockInFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-lsp-test-'));
  });

  it('finds block marker in file', () => {
    const filePath = path.join(tmpDir, 'test.spec.md');
    fs.writeFileSync(filePath, '### @block:my-block @kind:type\nSome content here.');

    const result = findBlockInFile(filePath, 'my-block');
    expect(result).not.toBeNull();
    expect(result!.line).toBe(0);
    expect(result!.character).toBeGreaterThan(0);
  });

  it('finds block on non-first line', () => {
    const filePath = path.join(tmpDir, 'test.spec.md');
    fs.writeFileSync(filePath, '# Header\n\nSome text\n\n### @block:target-block @kind:code\nContent');

    const result = findBlockInFile(filePath, 'target-block');
    expect(result).not.toBeNull();
    expect(result!.line).toBe(4);
  });

  it('returns null when block not found', () => {
    const filePath = path.join(tmpDir, 'test.spec.md');
    fs.writeFileSync(filePath, '### @block:other-block\nContent');

    const result = findBlockInFile(filePath, 'missing-block');
    expect(result).toBeNull();
  });

  it('returns null for nonexistent file', () => {
    const result = findBlockInFile('/nonexistent/file.md', 'any-block');
    expect(result).toBeNull();
  });
});

describe('resolveReference', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-lsp-test-'));
    _resetCache();

    const specFile = path.join(tmpDir, 'specs', 'test.spec.md');
    fs.mkdirSync(path.join(tmpDir, 'specs'), { recursive: true });
    fs.writeFileSync(specFile, '# Header\n\n### @block:hello @kind:type\nHello content.');
  });

  it('resolves file-only reference to line 0', () => {
    const ref = {
      fullMatch: '@ref:specs/test',
      refId: 'specs/test',
      line: 0,
      startChar: 0,
      endChar: 16,
    };
    const result = resolveReference(ref, tmpDir);
    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(path.join(tmpDir, 'specs/test.spec.md'));
    expect(result!.line).toBe(0);
    expect(result!.character).toBe(0);
  });

  it('resolves block reference to block location', () => {
    const ref = {
      fullMatch: '@ref:specs/test#hello',
      refId: 'specs/test',
      block: 'hello',
      line: 0,
      startChar: 0,
      endChar: 22,
    };
    const result = resolveReference(ref, tmpDir);
    expect(result).not.toBeNull();
    expect(result!.filePath).toBe(path.join(tmpDir, 'specs/test.spec.md'));
    expect(result!.line).toBe(2); // line 2 = '### @block:hello'
    expect(result!.character).toBeGreaterThan(0);
  });

  it('returns null for unresolvable file', () => {
    const ref = {
      fullMatch: '@ref:specs/missing',
      refId: 'specs/missing',
      line: 0,
      startChar: 0,
      endChar: 17,
    };
    const result = resolveReference(ref, tmpDir);
    expect(result).toBeNull();
  });
});
