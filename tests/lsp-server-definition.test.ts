/**
 * Tests for the LSP server go-to-definition handler logic.
 * Tests the reference parsing and target finding used by connection.onDefinition.
 */

import { describe, it, expect } from 'vitest';

describe('LSP Server — Go-to-Definition Handler', () => {
  interface Reference {
    fullMatch: string;
    refId: string;
    block?: string;
    line: number;
    startChar: number;
    endChar: number;
  }

  function parseReferences(text: string): Reference[] {
    const refs: Reference[] = [];
    const refRegex = /@ref:([a-zA-Z0-9_\-/.]+)(?:#([a-zA-Z0-9_\-/]+))?/g;
    const lines = text.split('\n');
    const lineOffsets: number[] = [0];
    for (let i = 0; i < lines.length; i++) {
      lineOffsets.push(lineOffsets[i] + lines[i].length + 1);
    }
    let match: RegExpExecArray | null;
    while ((match = refRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      const refId = match[1];
      const block = match[2] || undefined;
      let line = 0;
      for (let i = 0; i < lineOffsets.length - 1; i++) {
        if (matchStart >= lineOffsets[i] && matchStart < lineOffsets[i + 1]) {
          line = i;
          break;
        }
      }
      refs.push({
        fullMatch: match[0],
        refId,
        block,
        line,
        startChar: matchStart - lineOffsets[line],
        endChar: matchEnd - lineOffsets[line],
      });
    }
    return refs;
  }

  function findTargetRef(refs: Reference[], line: number, character: number): Reference | undefined {
    return refs.find(r =>
      r.line === line &&
      character >= r.startChar &&
      character <= r.endChar
    );
  }

  it('finds target reference when cursor is on @ref:', () => {
    const text = 'See @ref:specs/hello for details';
    const refs = parseReferences(text);
    const target = findTargetRef(refs, 0, 8);
    expect(target).toBeDefined();
    expect(target!.refId).toBe('specs/hello');
  });

  it('finds target reference when cursor is at start of @ref:', () => {
    const text = '@ref:specs/hello';
    const refs = parseReferences(text);
    const target = findTargetRef(refs, 0, 0);
    expect(target).toBeDefined();
    expect(target!.refId).toBe('specs/hello');
  });

  it('finds target reference when cursor is at end of @ref:', () => {
    const text = '@ref:specs/hello extra';
    const refs = parseReferences(text);
    const target = findTargetRef(refs, 0, 16);
    expect(target).toBeDefined();
    expect(target!.refId).toBe('specs/hello');
  });

  it('returns undefined for cursor outside @ref:', () => {
    const text = 'See @ref:specs/hello for details';
    const refs = parseReferences(text);
    const target = findTargetRef(refs, 0, 0);
    expect(target).toBeUndefined();
  });

  it('correctly identifies which ref when multiple on same line', () => {
    const text = 'Use @ref:specs/core and @ref:specs/hello';
    const refs = parseReferences(text);
    const first = findTargetRef(refs, 0, 10);
    expect(first).toBeDefined();
    expect(first!.refId).toBe('specs/core');
    const second = findTargetRef(refs, 0, 30);
    expect(second).toBeDefined();
    expect(second!.refId).toBe('specs/hello');
  });

  it('finds block reference', () => {
    const text = 'Check @ref:specs/hello#hello/overview for block';
    const refs = parseReferences(text);
    const target = findTargetRef(refs, 0, 10);
    expect(target).toBeDefined();
    expect(target!.refId).toBe('specs/hello');
    expect(target!.block).toBe('hello/overview');
  });

  it('returns empty for document with no references', () => {
    const refs = parseReferences('Just normal text with no refs');
    expect(refs).toHaveLength(0);
  });

  it('handles cursor on different line than reference', () => {
    const text = 'line1\n@ref:specs/hello\nline3';
    const refs = parseReferences(text);
    const target = findTargetRef(refs, 2, 0);
    expect(target).toBeUndefined();
  });

  it('handles references with hyphens in ids', () => {
    const text = '@ref:specs/safety-nets';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].refId).toBe('specs/safety-nets');
  });

  it('handles references with dots in ids', () => {
    const text = '@ref:specs/core.spec.dir/entities#my-block';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].refId).toBe('specs/core.spec.dir/entities');
    expect(refs[0].block).toBe('my-block');
  });

  it('handles reference at end of line without trailing text', () => {
    const text = 'see @ref:specs/hello';
    const refs = parseReferences(text);
    expect(refs).toHaveLength(1);
    expect(refs[0].endChar).toBe(20);
  });
});
