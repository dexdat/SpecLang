/**
 * Tests for SpecLang LSP completion (autocomplete) provider.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSpecCompletions,
  getBlockCompletions,
  detectCompletionContext,
} from '../../src/lsp/completions.js';
import { CompletionItemKind } from 'vscode-languageserver/node';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('detectCompletionContext', () => {
  it('detects spec completion with full @ref: prefix', () => {
    const ctx = detectCompletionContext('See @ref:specs/co');
    expect(ctx.type).toBe('spec');
    if (ctx.type === 'spec') {
      expect(ctx.partialId).toBe('specs/co');
    }
  });

  it('detects spec completion with empty partial', () => {
    const ctx = detectCompletionContext('See @ref:');
    expect(ctx.type).toBe('spec');
    if (ctx.type === 'spec') {
      expect(ctx.partialId).toBe('');
    }
  });

  it('detects block completion after #', () => {
    const ctx = detectCompletionContext('See @ref:specs/core#my-');
    expect(ctx.type).toBe('block');
    if (ctx.type === 'block') {
      expect(ctx.specId).toBe('specs/core');
      expect(ctx.partialBlock).toBe('my-');
    }
  });

  it('detects block completion with empty partial after #', () => {
    const ctx = detectCompletionContext('See @ref:specs/core#');
    expect(ctx.type).toBe('block');
    if (ctx.type === 'block') {
      expect(ctx.specId).toBe('specs/core');
      expect(ctx.partialBlock).toBe('');
    }
  });

  it('detects @ref prefix for snippet suggestion', () => {
    const ctx = detectCompletionContext('See @ref');
    expect(ctx.type).toBe('ref-prefix');
  });

  it('detects @re prefix for snippet suggestion', () => {
    const ctx = detectCompletionContext('See @re');
    expect(ctx.type).toBe('ref-prefix');
  });

  it('returns none for unrelated text', () => {
    const ctx = detectCompletionContext('Some random text');
    expect(ctx.type).toBe('none');
  });

  it('returns none for @ without ref context', () => {
    const ctx = detectCompletionContext('@mention user');
    expect(ctx.type).toBe('none');
  });
});

describe('getSpecCompletions', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-compl-test-'));
  });

  it('returns completions from specs/ directory', () => {
    const specsDir = path.join(tmpDir, 'specs');
    fs.mkdirSync(specsDir, { recursive: true });
    fs.writeFileSync(path.join(specsDir, 'core.spec.md'), '# core');
    fs.writeFileSync(path.join(specsDir, 'auth.spec.md'), '# auth');

    const items = getSpecCompletions(tmpDir);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('specs/core');
    expect(labels).toContain('specs/auth');
  });

  it('includes short names', () => {
    const items = getSpecCompletions(tmpDir);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('northstar');
  });

  it('returns items with Reference kind', () => {
    const specsDir = path.join(tmpDir, 'specs');
    fs.mkdirSync(specsDir, { recursive: true });
    fs.writeFileSync(path.join(specsDir, 'test.spec.md'), '# test');

    const items = getSpecCompletions(tmpDir);
    for (const item of items) {
      expect(item.kind).toBe(CompletionItemKind.Reference);
    }
  });

  it('walks subdirectories for spec files', () => {
    const specsDir = path.join(tmpDir, 'specs');
    const nestedDir = path.join(specsDir, 'core.spec.dir');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'entities.spec.md'), '# entities');

    const items = getSpecCompletions(tmpDir);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('specs/core.spec.dir/entities');
  });

  it('includes _index.json entries', () => {
    const indexData = {
      specs: {
        '@specs/from-index': { file: 'specs/from-index.spec.md', id: '@specs/from-index' },
      },
    };
    fs.writeFileSync(path.join(tmpDir, '_index.json'), JSON.stringify(indexData));

    const items = getSpecCompletions(tmpDir);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('specs/from-index');
  });

  it('returns empty list when no specs exist', () => {
    const items = getSpecCompletions(tmpDir);
    // Only short names should be present (northstar)
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(['northstar']);
  });

  it('sorts results alphabetically', () => {
    const specsDir = path.join(tmpDir, 'specs');
    fs.mkdirSync(specsDir, { recursive: true });
    fs.writeFileSync(path.join(specsDir, 'zebra.spec.md'), '# z');
    fs.writeFileSync(path.join(specsDir, 'alpha.spec.md'), '# a');

    const items = getSpecCompletions(tmpDir);
    const labels = items.map((i) => i.label);
    // northstar comes first, then alpha, then zebra
    expect(labels[0]).toBe('northstar');
    expect(labels[1]).toBe('specs/alpha');
    expect(labels[2]).toBe('specs/zebra');
  });
});

describe('getBlockCompletions', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-compl-test-'));
  });

  it('extracts blocks from spec file', () => {
    const specFile = path.join(tmpDir, 'test.spec.md');
    const content = [
      '### @block:init @kind:setup',
      'Initialization steps.',
      '',
      '### @block:cleanup @kind:teardown',
      'Cleanup steps.',
    ].join('\n');
    fs.writeFileSync(specFile, content);

    const items = getBlockCompletions(specFile);
    expect(items).toHaveLength(2);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('init');
    expect(labels).toContain('cleanup');
  });

  it('returns items with Struct kind', () => {
    const specFile = path.join(tmpDir, 'test.spec.md');
    fs.writeFileSync(specFile, '### @block:hello @kind:type\nContent');

    const items = getBlockCompletions(specFile);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe(CompletionItemKind.Struct);
  });

  it('deduplicates blocks with same name', () => {
    const specFile = path.join(tmpDir, 'test.spec.md');
    const content = [
      '### @block:shared @kind:a',
      '### @block:shared @kind:b',
    ].join('\n');
    fs.writeFileSync(specFile, content);

    const items = getBlockCompletions(specFile);
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('shared');
  });

  it('returns empty for file with no blocks', () => {
    const specFile = path.join(tmpDir, 'test.spec.md');
    fs.writeFileSync(specFile, '# Just a header\nSome content without blocks.');

    const items = getBlockCompletions(specFile);
    expect(items).toHaveLength(0);
  });

  it('returns empty for nonexistent file', () => {
    const items = getBlockCompletions('/nonexistent/file.md');
    expect(items).toHaveLength(0);
  });

  it('includes detail with @block: prefix', () => {
    const specFile = path.join(tmpDir, 'test.spec.md');
    fs.writeFileSync(specFile, '### @block:setup @kind:type');

    const items = getBlockCompletions(specFile);
    expect(items[0].detail).toBe('@block:setup');
  });
});
