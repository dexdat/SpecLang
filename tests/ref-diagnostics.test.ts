import { describe, it, expect } from 'vitest';
import { parseReferences } from '../src/lsp/references.js';

interface DiagnosticResult {
  severity: number;
  message: string;
  source: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

const mockSpecFiles: Record<string, string> = {
  'specs/existing': '/workspace/specs/existing.spec.md',
  'specs/with-blocks': '/workspace/specs/with-blocks.spec.md',
};

const mockBlockLocations: Record<string, { line: number; character: number } | null> = {
  '/workspace/specs/with-blocks.spec.md#login': { line: 10, character: 0 },
};

function mockResolveFileRef(refId: string): string | null {
  return mockSpecFiles[refId] || null;
}

function mockFindBlockInFile(filePath: string, blockName: string): { line: number; character: number } | null {
  const key = `${filePath}#${blockName}`;
  return mockBlockLocations[key] || null;
}

function validateReferences(text: string): DiagnosticResult[] {
  const diagnostics: DiagnosticResult[] = [];
  const refs = parseReferences(text);

  for (const ref of refs) {
    const filePath = mockResolveFileRef(ref.refId);
    if (!filePath) {
      diagnostics.push({
        severity: 2,
        message: `Unresolved spec reference: @ref:${ref.refId}`,
        source: 'speclang',
        range: {
          start: { line: ref.line, character: ref.startChar },
          end: { line: ref.line, character: ref.endChar },
        },
      });
      continue;
    }

    if (ref.block) {
      const blockLocation = mockFindBlockInFile(filePath, ref.block);
      if (!blockLocation) {
        diagnostics.push({
          severity: 2,
          message: `Block '${ref.block}' not found in ${ref.refId}`,
          source: 'speclang',
          range: {
            start: { line: ref.line, character: ref.startChar },
            end: { line: ref.line, character: ref.endChar },
          },
        });
      }
    }
  }

  return diagnostics;
}

describe('LSP Server — Reference Validation Diagnostics', () => {
  it('should produce diagnostic for non-existent spec reference', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'Ref: @ref:specs/non-existent',
    ].join('\n');

    const diagnostics = validateReferences(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe(2);
    expect(diagnostics[0].message).toBe('Unresolved spec reference: @ref:specs/non-existent');
    expect(diagnostics[0].source).toBe('speclang');
  });

  it('should produce diagnostic for non-existent block reference', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'Ref: @ref:specs/with-blocks#missing-block',
    ].join('\n');

    const diagnostics = validateReferences(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe(2);
    expect(diagnostics[0].message).toBe("Block 'missing-block' not found in specs/with-blocks");
    expect(diagnostics[0].source).toBe('speclang');
  });

  it('should produce no diagnostic for valid spec reference', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'Ref: @ref:specs/existing',
    ].join('\n');

    const diagnostics = validateReferences(doc);
    expect(diagnostics).toHaveLength(0);
  });

  it('should produce no diagnostic for valid spec + block reference', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'Ref: @ref:specs/with-blocks#login',
    ].join('\n');

    const diagnostics = validateReferences(doc);
    expect(diagnostics).toHaveLength(0);
  });

  it('should produce no diagnostic for non-@ref text', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'Just some regular text without references.',
    ].join('\n');

    const diagnostics = validateReferences(doc);
    expect(diagnostics).toHaveLength(0);
  });

  it('should cover the exact @ref annotation range in diagnostics', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'Ref: @ref:specs/missing-spec',
    ].join('\n');

    const diagnostics = validateReferences(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].range.start.line).toBe(6);
    expect(diagnostics[0].range.start.character).toBe(5);
    expect(diagnostics[0].range.end.character).toBe(28);
  });

  it('should produce diagnostics for multiple broken references', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'First: @ref:specs/missing-a',
      'Second: @ref:specs/missing-b',
    ].join('\n');

    const diagnostics = validateReferences(doc);
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0].message).toBe('Unresolved spec reference: @ref:specs/missing-a');
    expect(diagnostics[1].message).toBe('Unresolved spec reference: @ref:specs/missing-b');
  });

  it('should produce block-not-found diagnostic even when spec file exists', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      'layer: 5',
      '---',
      '',
      'Ref: @ref:specs/with-blocks#nonexistent-block',
    ].join('\n');

    const diagnostics = validateReferences(doc);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toBe("Block 'nonexistent-block' not found in specs/with-blocks");
  });
});
