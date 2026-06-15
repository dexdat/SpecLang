import { describe, it, expect } from 'vitest';
import { parseHeader, SpecHeader } from '../../src/lsp/server.js';

function buildHoverContent(
  header: SpecHeader,
  line: number,
  bodyStart: number,
): string | null {
  if (bodyStart === 0) return null;
  if (line < 1 || line > bodyStart - 2) return null;

  const parts: string[] = ['**SpecLang Spec**'];

  if (header.id !== undefined) parts.push(`- **ID:** ${header.id}`);
  if (header.version !== undefined) parts.push(`- **Version:** ${header.version}`);
  if (header.layer !== undefined) parts.push(`- **Layer:** ${header.layer}`);
  if (header.tags !== undefined) parts.push(`- **Tags:** ${header.tags.replace(/^\[|\]$/g, '')}`);
  if (header.agent_support !== undefined) parts.push(`- **Agent Support:** ${header.agent_support}`);
  if (header.short !== undefined) parts.push(`- **Short:** ${header.short}`);
  if (header.project_level !== undefined) parts.push(`- **Project Level:** ${header.project_level}`);

  return parts.join('\n');
}

describe('LSP Server — Hover', () => {
  it('should return metadata for hover within header area with all fields', () => {
    const doc = [
      '---',
      'id: "@specs/test-spec"',
      'version: "1.0.0"',
      'layer: 5',
      'tags: [example, feature]',
      'agent_support: agent_assonomous',
      'project_level: Alpha',
      '---',
      '',
      '# Test Spec',
    ].join('\n');

    const { header, bodyStart } = parseHeader(doc);
    const content = buildHoverContent(header, 3, bodyStart);

    expect(content).not.toBeNull();
    expect(content).toContain('**SpecLang Spec**');
    expect(content).toContain('@specs/test-spec');
    expect(content).toContain('1.0.0');
    expect(content).toContain('5');
    expect(content).toContain('example, feature');
    expect(content).toContain('agent_assonomous');
    expect(content).toContain('Alpha');
  });

  it('should show only present fields for partial header', () => {
    const doc = [
      '---',
      'id: "@specs/partial"',
      '---',
      '',
    ].join('\n');

    const { header, bodyStart } = parseHeader(doc);
    const content = buildHoverContent(header, 1, bodyStart);

    expect(content).not.toBeNull();
    expect(content).toContain('**SpecLang Spec**');
    expect(content).toContain('@specs/partial');
    expect(content).not.toContain('Version');
    expect(content).not.toContain('Layer');
    expect(content).not.toContain('Tags');
    expect(content).not.toContain('Agent Support');
  });

  it('should return null for hover outside header area (in body)', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      '---',
      '',
      '# Body content',
    ].join('\n');

    const { header, bodyStart } = parseHeader(doc);
    const content = buildHoverContent(header, 4, bodyStart);
    expect(content).toBeNull();
  });

  it('should return null for hover on opening or closing ---', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      '---',
      '',
    ].join('\n');

    const { header, bodyStart } = parseHeader(doc);
    expect(buildHoverContent(header, 0, bodyStart)).toBeNull();
    expect(buildHoverContent(header, 2, bodyStart)).toBeNull();
  });

  it('should return null for file with no header', () => {
    const doc = '# Just a markdown file\n\nNo frontmatter.';
    const { header, bodyStart } = parseHeader(doc);
    expect(bodyStart).toBe(0);
    expect(buildHoverContent(header, 0, bodyStart)).toBeNull();
  });

  it('should return full metadata when hovering over any header line', () => {
    const doc = [
      '---',
      'id: "@specs/multi"',
      'version: "2.0.0"',
      'layer: 3',
      '---',
      '',
    ].join('\n');

    const { header, bodyStart } = parseHeader(doc);

    const content1 = buildHoverContent(header, 1, bodyStart);
    expect(content1).toContain('@specs/multi');
    expect(content1).toContain('2.0.0');
    expect(content1).toContain('3');

    const content2 = buildHoverContent(header, 2, bodyStart);
    expect(content2).toContain('@specs/multi');
    expect(content2).toContain('2.0.0');
    expect(content2).toContain('3');
  });

  it('should return hover content formatted as markdown', () => {
    const doc = [
      '---',
      'id: "@specs/test"',
      'version: "1.0.0"',
      '---',
      '',
    ].join('\n');

    const { header, bodyStart } = parseHeader(doc);
    const content = buildHoverContent(header, 1, bodyStart);

    expect(content).not.toBeNull();
    expect(content).toContain('**SpecLang Spec**');
    expect(content).toContain('- **ID:**');
    expect(content).toContain('- **Version:**');
  });
});
