/**
 * SPECLANG-GENERATED: Tests for codegen parser
 * Source: @speclang/codegen @block:parser-test
 */

import { describe, it, expect } from 'vitest';
import { parseCodeSpecContent } from '../../src/codegen/parser';

describe('codegen/parser', () => {
  describe('parseCodeSpecContent', () => {
    it('should parse a basic spec with code blocks', () => {
      // Use flexible format - no lines count
      const content = `# speclang-header
id: "@test/example"
version: "1.0.0"
target: typescript
---

## @block:test/interface @kind:interface
export interface User {
  id: string;
  name: string;
}
`;

      const spec = parseCodeSpecContent(content, 'test.spec');
      
      expect(spec.header.id).toBe('@test/example');
      expect(spec.header.version).toBe('1.0.0');
      expect(spec.target.language).toBe('typescript');
      expect(spec.blocks.length).toBeGreaterThan(0);
    });

    it('should extract code blocks with correct kind', () => {
      const content = `# speclang-header
id: "@test/kinds"
version: "1.0.0"
---

## @block:test/func @kind:function
function test(): void {}
`;

      const spec = parseCodeSpecContent(content, 'test.spec');
      
      expect(spec.blocks[0]?.kind).toBe('function');
    });

    it('should extract references from blocks', () => {
      const content = `# speclang-header
id: "@test/refs"
version: "1.0.0"
---

## @block:test/op @kind:operation @ref:specs/auth#login
some content
`;

      const spec = parseCodeSpecContent(content, 'test.spec');
      
      expect(spec.blocks[0]?.refs).toContain('specs/auth#login');
    });

    it('should handle multiple blocks', () => {
      const content = `# speclang-header
id: "@test/multi"
version: "1.0.0"
---

## @block:test/first @kind:code
const a = 1;

## @block:test/second @kind:code
const b = 2;
`;

      const spec = parseCodeSpecContent(content, 'test.spec');
      
      expect(spec.blocks.length).toBe(2);
    });

    it('should default to typescript target', () => {
      const content = `# speclang-header
id: "@test/default"
version: "1.0.0"
---
`;

      const spec = parseCodeSpecContent(content, 'test.spec');
      
      expect(spec.target.language).toBe('typescript');
    });
  });
});
