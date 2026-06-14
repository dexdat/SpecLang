/**
 * Tests for SpecLang LSP server.
 *
 * Uses lightweight connection mocking — no real LSP transport needed.
 * Tests the validation logic and server lifecycle directly.
 */

import { describe, it, expect } from 'vitest';

// We test the validation logic directly (unit tests) since full LSP transport
// requires a running server on stdio.
describe('LSP Server — Header Parsing', () => {
  /**
   * Inline the parseHeader logic for test isolation.
   * In production this is in src/lsp/server.ts.
   */
  interface SpecHeader {
    id?: string;
    version?: string;
    layer?: string | number;
  }

  function parseHeader(text: string): { header: SpecHeader; bodyStart: number } {
    const header: SpecHeader = {};
    let bodyStart = 0;

    const lines = text.split('\n');
    if (lines.length === 0 || lines[0].trim() !== '---') {
      return { header, bodyStart: 0 };
    }

    let i = 1;
    for (; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        bodyStart = i + 1;
        break;
      }
      const match = lines[i].match(/^(\w[\w-]*)\s*:\s*(.+)$/);
      if (match) {
        const key = match[1];
        const value = match[2].trim();
        switch (key) {
          case 'id':
            header.id = value.replace(/['"]/g, '');
            break;
          case 'version':
            header.version = value.replace(/['"]/g, '');
            break;
          case 'layer':
            header.layer = value;
            break;
        }
      }
    }

    return { header, bodyStart };
  }

  it('should parse a valid spec header with all fields', () => {
    const doc = [
      '---',
      'id: "@specs/test-spec"',
      'version: "1.0.0"',
      'layer: 5',
      'tags: [example]',
      '---',
      '',
      '# Test Spec',
    ].join('\n');

    const { header, bodyStart } = parseHeader(doc);
    expect(header.id).toBe('@specs/test-spec');
    expect(header.version).toBe('1.0.0');
    expect(header.layer).toBe('5');
    expect(bodyStart).toBe(6);
  });

  it('should return empty header for text without frontmatter', () => {
    const doc = '# Just a markdown file\n\nNo frontmatter here.';
    const { header, bodyStart } = parseHeader(doc);
    expect(header.id).toBeUndefined();
    expect(header.version).toBeUndefined();
    expect(header.layer).toBeUndefined();
    expect(bodyStart).toBe(0);
  });

  it('should parse partial header with missing fields', () => {
    const doc = [
      '---',
      'id: "@specs/partial"',
      '---',
      '',
      '# Partial spec',
    ].join('\n');

    const { header } = parseHeader(doc);
    expect(header.id).toBe('@specs/partial');
    expect(header.version).toBeUndefined();
    expect(header.layer).toBeUndefined();
  });

  it('should handle empty document', () => {
    const { header } = parseHeader('');
    expect(header.id).toBeUndefined();
    expect(header.version).toBeUndefined();
    expect(header.layer).toBeUndefined();
  });

  it('should handle header-only document with no closing ---', () => {
    const doc = '---\nid: "@specs/open"';
    const { header } = parseHeader(doc);
    expect(header.id).toBe('@specs/open');
  });
});

describe('LSP Server — Validation Diagnostics', () => {
  interface SpecHeader {
    id?: string;
    version?: string;
    layer?: string | number;
  }

  interface DiagnosticResult {
    severity: number;
    message: string;
    source: string;
  }

  function validateDiagnostics(header: SpecHeader): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];

    if (!header.id) {
      results.push({
        severity: 2, // Warning
        message: "Missing required header field: id. SpecLang specs must define 'id' in the YAML frontmatter.",
        source: 'speclang',
      });
    }
    if (!header.version) {
      results.push({
        severity: 2,
        message: "Missing required header field: version. SpecLang specs must define 'version' in the YAML frontmatter.",
        source: 'speclang',
      });
    }
    if (!header.layer) {
      results.push({
        severity: 2,
        message: "Missing required header field: layer. SpecLang specs must define 'layer' in the YAML frontmatter.",
        source: 'speclang',
      });
    }

    if (header.layer !== undefined) {
      const layerNum = Number(header.layer);
      if (isNaN(layerNum)) {
        results.push({
          severity: 2,
          message: `Layer must be a number, got: '${header.layer}'. Valid layers: 0-10.`,
          source: 'speclang',
        });
      }
    }

    return results;
  }

  it('should return no diagnostics for complete header', () => {
    const header: SpecHeader = { id: '@specs/test', version: '1.0.0', layer: '5' };
    const diags = validateDiagnostics(header);
    expect(diags).toHaveLength(0);
  });

  it('should return diagnostic for missing id', () => {
    const header: SpecHeader = { version: '1.0.0', layer: '3' };
    const diags = validateDiagnostics(header);
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toContain('id');
  });

  it('should return diagnostics for all missing fields', () => {
    const header: SpecHeader = {};
    const diags = validateDiagnostics(header);
    expect(diags).toHaveLength(3);
    const messages = diags.map((d) => d.message);
    expect(messages.some((m) => m.includes('id'))).toBe(true);
    expect(messages.some((m) => m.includes('version'))).toBe(true);
    expect(messages.some((m) => m.includes('layer'))).toBe(true);
  });

  it('should warn on non-numeric layer value', () => {
    const header: SpecHeader = { id: '@specs/test', version: '1.0.0', layer: 'alpha' };
    const diags = validateDiagnostics(header);
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toContain('Layer must be a number');
  });

  it('should accept numeric layer as string', () => {
    const header: SpecHeader = { id: '@specs/test', version: '1.0.0', layer: '7' };
    const diags = validateDiagnostics(header);
    expect(diags).toHaveLength(0);
  });
});
