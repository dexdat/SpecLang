import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  getSpecCompletions,
  getBlockCompletions,
  detectCompletionContext,
} from '../src/lsp/completions';

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'speclang-completions-'));
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function createFile(relPath: string, content: string): void {
  const fullPath = path.join(tmpRoot, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function createDir(relPath: string): void {
  fs.mkdirSync(path.join(tmpRoot, relPath), { recursive: true });
}

describe('getSpecCompletions', () => {
  it('returns completions from specs/ directory', () => {
    createDir('specs');
    createFile('specs/core.spec.md', '# Core spec');
    createFile('specs/auth.spec.md', '# Auth spec');
    createFile('specs/hello.scl', '# Hello scl');

    const items = getSpecCompletions(tmpRoot);
    const labels = items.map((i) => i.label);

    expect(labels).toContain('specs/core');
    expect(labels).toContain('specs/auth');
    expect(labels).toContain('specs/hello');
  });

  it('handles nested .spec.dir files', () => {
    createDir('specs/auth.spec.dir');
    createFile('specs/auth.spec.dir/entities.spec.md', '# Entities');

    const items = getSpecCompletions(tmpRoot);
    const labels = items.map((i) => i.label);

    expect(labels).toContain('specs/auth.spec.dir/entities');
  });

  it('returns completions from _index.json', () => {
    createDir('specs');
    createFile(
      '_index.json',
      JSON.stringify({
        specs: {
          '@speclang/core': { file: 'specs/core.spec.md' },
          '@specs/maturity': { file: 'specs/maturity.spec.md' },
        },
      })
    );

    const items = getSpecCompletions(tmpRoot);
    const labels = items.map((i) => i.label);

    expect(labels).toContain('speclang/core');
    expect(labels).toContain('specs/maturity');
  });

  it('returns short name completions', () => {
    createDir('specs');

    const items = getSpecCompletions(tmpRoot);
    const labels = items.map((i) => i.label);

    expect(labels).toContain('northstar');
  });

  it('returns empty list when no specs exist', () => {
    const items = getSpecCompletions(tmpRoot);
    const specLabels = items.filter((i) => i.label.startsWith('specs/'));
    expect(specLabels).toHaveLength(0);
  });

  it('each item has kind=Reference', () => {
    createDir('specs');
    createFile('specs/core.spec.md', '# Core');

    const items = getSpecCompletions(tmpRoot);
    for (const item of items) {
      expect(item.kind).toBe(18); // CompletionItemKind.Reference = 18
    }
  });

  it('sorts completions alphabetically', () => {
    createDir('specs');
    createFile('specs/zzz.spec.md', '# Z');
    createFile('specs/aaa.spec.md', '# A');
    createFile('specs/mmm.spec.md', '# M');

    const items = getSpecCompletions(tmpRoot);
    const specLabels = items.map((i) => i.label).filter((l) => l.startsWith('specs/'));

    for (let i = 1; i < specLabels.length; i++) {
      expect(specLabels[i].localeCompare(specLabels[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it('deduplicates entries across sources', () => {
    createDir('specs');
    createFile('specs/core.spec.md', '# Core');
    createFile(
      '_index.json',
      JSON.stringify({
        specs: {
          '@specs/core': { file: 'specs/core.spec.md' },
        },
      })
    );

    const items = getSpecCompletions(tmpRoot);
    const coreItems = items.filter((i) => i.label === 'specs/core');

    expect(coreItems).toHaveLength(1);
  });
});

describe('getBlockCompletions', () => {
  it('extracts blocks from spec file', () => {
    const specPath = path.join(tmpRoot, 'test.spec.md');
    fs.writeFileSync(
      specPath,
      [
        '---',
        'id: "@test/test"',
        'version: "1.0.0"',
        'layer: 5',
        '---',
        '',
        '### @block:hello @kind:code',
        'Hello world',
        '',
        '### @block:goodbye @kind:code',
        'Goodbye',
      ].join('\n')
    );

    const items = getBlockCompletions(specPath);
    const labels = items.map((i) => i.label);

    expect(labels).toContain('hello');
    expect(labels).toContain('goodbye');
  });

  it('returns empty for file with no blocks', () => {
    const specPath = path.join(tmpRoot, 'empty.spec.md');
    fs.writeFileSync(specPath, '# No blocks here\n\nJust some text.');

    const items = getBlockCompletions(specPath);
    expect(items).toHaveLength(0);
  });

  it('returns empty for nonexistent file', () => {
    const items = getBlockCompletions(path.join(tmpRoot, 'nonexistent.spec.md'));
    expect(items).toHaveLength(0);
  });

  it('each item has kind=Struct', () => {
    const specPath = path.join(tmpRoot, 'test.spec.md');
    fs.writeFileSync(specPath, '### @block:test-block\nTest');

    const items = getBlockCompletions(specPath);
    for (const item of items) {
      expect(item.kind).toBe(22); // CompletionItemKind.Struct = 22
    }
  });

  it('deduplicates blocks with same name', () => {
    const specPath = path.join(tmpRoot, 'dup.spec.md');
    fs.writeFileSync(
      specPath,
      [
        '### @block:hello',
        'first',
        '### @block:hello',
        'second',
      ].join('\n')
    );

    const items = getBlockCompletions(specPath);
    const hellos = items.filter((i) => i.label === 'hello');
    expect(hellos).toHaveLength(1);
  });

  it('extracts blocks with colons and slashes', () => {
    const specPath = path.join(tmpRoot, 'complex.spec.md');
    fs.writeFileSync(
      specPath,
      [
        '### @block::add',
        '',
        '### @block:core/overview',
        '',
        '### @block:components/layout',
      ].join('\n')
    );

    const items = getBlockCompletions(specPath);
    const labels = items.map((i) => i.label);

    expect(labels).toContain(':add');
    expect(labels).toContain('core/overview');
    expect(labels).toContain('components/layout');
  });
});

describe('detectCompletionContext', () => {
  it('@ref: triggers spec completions', () => {
    const ctx = detectCompletionContext('@ref:');
    expect(ctx.type).toBe('spec');
    if (ctx.type === 'spec') {
      expect(ctx.partialId).toBe('');
    }
  });

  it('@ref:specs/core triggers spec completions with partialId', () => {
    const ctx = detectCompletionContext('@ref:specs/cor');
    expect(ctx.type).toBe('spec');
    if (ctx.type === 'spec') {
      expect(ctx.partialId).toBe('specs/cor');
    }
  });

  it('@ref:specs/core# triggers block completions', () => {
    const ctx = detectCompletionContext('@ref:specs/core#');
    expect(ctx.type).toBe('block');
    if (ctx.type === 'block') {
      expect(ctx.specId).toBe('specs/core');
      expect(ctx.partialBlock).toBe('');
    }
  });

  it('@ref:specs/core#hello triggers block completions with partialBlock', () => {
    const ctx = detectCompletionContext('@ref:specs/core#hel');
    expect(ctx.type).toBe('block');
    if (ctx.type === 'block') {
      expect(ctx.specId).toBe('specs/core');
      expect(ctx.partialBlock).toBe('hel');
    }
  });

  it('@ref:specs/auth.spec.dir/entities# triggers block completions', () => {
    const ctx = detectCompletionContext('@ref:specs/auth.spec.dir/entities#');
    expect(ctx.type).toBe('block');
    if (ctx.type === 'block') {
      expect(ctx.specId).toBe('specs/auth.spec.dir/entities');
      expect(ctx.partialBlock).toBe('');
    }
  });

  it('@r triggers @ref: snippet', () => {
    const ctx = detectCompletionContext('@r');
    expect(ctx.type).toBe('ref-prefix');
  });

  it('@re triggers @ref: snippet', () => {
    const ctx = detectCompletionContext('@re');
    expect(ctx.type).toBe('ref-prefix');
  });

  it('@ref triggers @ref: snippet', () => {
    const ctx = detectCompletionContext('@ref');
    expect(ctx.type).toBe('ref-prefix');
  });

  it('@ref: prefix followed by space does not match', () => {
    const ctx = detectCompletionContext('@ref: ');
    expect(ctx.type).toBe('none');
  });

  it('non-@ref text returns empty', () => {
    expect(detectCompletionContext('hello world').type).toBe('none');
    expect(detectCompletionContext('').type).toBe('none');
    expect(detectCompletionContext('some @other text').type).toBe('none');
  });

  it('@ref: in middle of text still detected', () => {
    const ctx = detectCompletionContext('Here is a ref: @ref:specs/cor');
    expect(ctx.type).toBe('spec');
    if (ctx.type === 'spec') {
      expect(ctx.partialId).toBe('specs/cor');
    }
  });
});
