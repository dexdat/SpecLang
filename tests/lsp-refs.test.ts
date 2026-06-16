import { describe, it, expect, beforeEach } from 'vitest';
import { parseReferences, resolveFileRef, findBlockInFile, resolveReference, _resetCache } from '../src/lsp/references.js';
import * as path from 'path';

const workspaceRoot = path.resolve(__dirname, '..');

describe('parseReferences', () => {
  it('extracts simple file reference', () => {
    const text = 'See @ref:specs/hello for details';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].fullMatch).toBe('@ref:specs/hello');
    expect(refs[0].refId).toBe('specs/hello');
    expect(refs[0].block).toBeUndefined();
    expect(refs[0].startChar).toBe(4);
    expect(refs[0].endChar).toBe(20);
  });

  it('extracts block reference', () => {
    const text = 'Check @ref:specs/hello#hello/overview for overview';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].fullMatch).toBe('@ref:specs/hello#hello/overview');
    expect(refs[0].refId).toBe('specs/hello');
    expect(refs[0].block).toBe('hello/overview');
  });

  it('extracts multiple references', () => {
    const text = 'Use @ref:specs/core and @ref:specs/hello';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(2);
    expect(refs[0].refId).toBe('specs/core');
    expect(refs[1].refId).toBe('specs/hello');
    expect(refs[1].startChar).toBe(24);
  });

  it('returns empty array for text without references', () => {
    const refs = parseReferences('No references here');
    expect(refs).toHaveLength(0);
  });

  it('tracks positions correctly across lines', () => {
    const text = 'line1\n@ref:specs/hello\nline3';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].line).toBe(1);
    expect(refs[0].startChar).toBe(0);
    expect(refs[0].endChar).toBe(16);
  });

  it('handles reference at start of text', () => {
    const text = '@ref:specs/hello';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].line).toBe(0);
    expect(refs[0].startChar).toBe(0);
    expect(refs[0].endChar).toBe(16);
  });

  it('handles references with hyphens in ids', () => {
    const text = 'See @ref:specs/safety-nets for safety';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].refId).toBe('specs/safety-nets');
  });

  it('handles references with dots in ids', () => {
    const text = '@ref:specs/core.spec.dir/entities';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].refId).toBe('specs/core.spec.dir/entities');
  });
});

describe('resolveFileRef', () => {
  beforeEach(() => {
    _resetCache();
  });

  it('resolves simple spec name to .spec.md file', () => {
    const resolved = resolveFileRef('specs/hello', workspaceRoot);
    expect(resolved).not.toBeNull();
    expect(resolved!).toMatch(/specs\/hello\.spec\.md$/);
  });

  it('resolves northstar short name', () => {
    const resolved = resolveFileRef('northstar', workspaceRoot);
    expect(resolved).not.toBeNull();
    expect(resolved!).toMatch(/docs\/NORTH_STAR\.md$/);
  });

  it('returns null for non-existent ref', () => {
    const resolved = resolveFileRef('specs/nonexistent-file-xyz', workspaceRoot);
    expect(resolved).toBeNull();
  });

  it('resolves via _index.json fallback', () => {
    const resolved = resolveFileRef('speclang/core', workspaceRoot);
    expect(resolved).not.toBeNull();
    expect(resolved!).toMatch(/specs\/core\.spec\.md$/);
  });
});

describe('findBlockInFile', () => {
  it('finds a block at correct line', () => {
    const helloPath = path.join(workspaceRoot, 'specs/hello.spec.md');
    const result = findBlockInFile(helloPath, 'hello/overview');
    expect(result).not.toBeNull();
    expect(result!.line).toBeGreaterThanOrEqual(0);
    expect(result!.character).toBeGreaterThanOrEqual(0);
  });

  it('returns null for non-existent block', () => {
    const helloPath = path.join(workspaceRoot, 'specs/hello.spec.md');
    const result = findBlockInFile(helloPath, 'nonexistent-block-xyz');
    expect(result).toBeNull();
  });

  it('returns null for non-existent file', () => {
    const result = findBlockInFile('/nonexistent/file.spec.md', 'any-block');
    expect(result).toBeNull();
  });
});

describe('resolveReference', () => {
  beforeEach(() => {
    _resetCache();
  });

  it('resolves file reference to file location', () => {
    const ref = {
      fullMatch: '@ref:specs/hello',
      refId: 'specs/hello',
      block: undefined as string | undefined,
      line: 0,
      startChar: 0,
      endChar: 16,
    };
    const location = resolveReference(ref, workspaceRoot);
    expect(location).not.toBeNull();
    expect(location!.filePath).toMatch(/specs\/hello\.spec\.md$/);
    expect(location!.line).toBe(0);
    expect(location!.character).toBe(0);
  });

  it('resolves block reference to block location', () => {
    const ref = {
      fullMatch: '@ref:specs/hello#hello/overview',
      refId: 'specs/hello',
      block: 'hello/overview' as string | undefined,
      line: 0,
      startChar: 0,
      endChar: 29,
    };
    const location = resolveReference(ref, workspaceRoot);
    expect(location).not.toBeNull();
    expect(location!.filePath).toMatch(/specs\/hello\.spec\.md$/);
    expect(location!.line).toBeGreaterThan(0);
  });

  it('returns null for unresolvable reference', () => {
    const ref = {
      fullMatch: '@ref:nonexistent/path',
      refId: 'nonexistent/path',
      block: undefined as string | undefined,
      line: 0,
      startChar: 0,
      endChar: 20,
    };
    const location = resolveReference(ref, workspaceRoot);
    expect(location).toBeNull();
  });
});
