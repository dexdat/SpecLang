# speclang-header lines:15
id: "@speclang/roadmap/poc/header-parser"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Parse spec headers (YAML frontmatter)"
tags: [poc, parser, header, yaml, frontmatter]
---

# POC: Header Parser

Parse `# speclang-header` YAML frontmatter from spec files.

## Purpose

Extract metadata from spec file headers:
- Spec ID (`@specs/example`)
- Version (`1.0.0`)
- Layer (`5`)
- Short description
- Tags

## Input Format

### @poc/header-parser/input

**Header Structure:**
```markdown
# speclang-header lines:N
id: @specs/example
version: 1.0.0
layer: 5
short: Brief description
tags: [example, feature]
---

# Spec Content Here
...
```

**Required Fields:**
- `id` - Unique spec identifier
- `version` - Semantic version
- `layer` - Abstraction layer (0-10)

**Optional Fields:**
- `short` - Brief description
- `tags` - Array of tags
- `parent` - Parent spec reference
- `target` - Output file path

## Output Format

### @poc/header-parser/output

**Parsed Header Interface:**
```typescript
import { SpecHeader, HeaderValidationResult } from './types';

export class HeaderParser {
  /**
   * Parse header from content
   * @param content - Full file content
   * @returns Parsed header
   * @throws {POCError} If header is invalid
   */
  parse(content: string): SpecHeader {
    const lines = content.split('\n');
    
    // Validate header marker
    if (!lines[0]?.startsWith('# speclang-header')) {
      throw new POCError('HEADER_ERROR', 'Missing # speclang-header marker');
    }
    
    // Extract line count
    const lineCountMatch = lines[0].match(/lines:(\d+)/);
    if (!lineCountMatch) {
      throw new POCError('HEADER_ERROR', 'Missing lines:N in header marker');
    }
    
    const lineCount = parseInt(lineCountMatch[1], 10);
    const headerLines = lines.slice(1, lineCount);
    
    // Parse YAML content
    const header = this.parseYaml(headerLines.join('\n'));
    
    // Validate required fields
    this.validateHeader(header);
    
    return {
      id: header.id,
      version: header.version,
      layer: header.layer,
      short: header.short || '',
      tags: header.tags || [],
      lineCount,
      rawHeader: lines.slice(0, lineCount).join('\n')
    };
  }
  
  /**
   * Validate a parsed header
   */
  validateHeader(data: any): void {
    // Required: id
    if (!data.id) {
      throw new POCError('HEADER_ERROR', 'Missing required field: id');
    }
    if (!data.id.startsWith('@')) {
      throw new POCError('HEADER_ERROR', 'Spec ID must start with @');
    }
    
    // Required: version
    if (!data.version) {
      throw new POCError('HEADER_ERROR', 'Missing required field: version');
    }
    if (!/^\d+\.\d+\.\d+/.test(data.version)) {
      throw new POCError('HEADER_ERROR', 'Version must be semantic (e.g., 1.0.0)');
    }
    
    // Required: layer
    if (data.layer === undefined) {
      throw new POCError('HEADER_ERROR', 'Missing required field: layer');
    }
    if (typeof data.layer !== 'number' || data.layer < 0 || data.layer > 10) {
      throw new POCError('HEADER_ERROR', 'Layer must be number 0-10');
    }
    
    // Optional: tags
    if (data.tags && !Array.isArray(data.tags)) {
      throw new POCError('HEADER_ERROR', 'Tags must be an array');
    }
  }
  
  /**
   * Parse YAML content (simplified for POC)
   * Supports: key: value, arrays, strings
   */
  private parseYaml(yaml: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Match key: value
      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        result[key] = this.parseValue(value);
      }
    }
    
    return result;
  }
  
  /**
   * Parse a YAML value
   */
  private parseValue(value: string): any {
    const trimmed = value.trim();
    
    // Array: [a, b, c]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
        .filter(s => s);
    }
    
    // Number
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    
    // Boolean
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // String (remove quotes)
    return trimmed.replace(/^["']|["']$/g, '');
  }
}
```

## Validation Rules

### @poc/header-parser/validation

**Required Fields:**

| Field | Type | Validation |
|-------|------|------------|
| id | string | Must start with `@` |
| version | string | Semantic versioning (1.0.0) |
| layer | number | Integer 0-10 |

**Optional Fields:**

| Field | Type | Default |
|-------|------|---------|
| short | string | `""` |
| tags | string[] | `[]` |
| parent | string | `undefined` |
| target | string | `undefined` |

**Error Cases:**

```typescript
// Missing header marker
// ❌ Throws: 'Missing # speclang-header marker'

// Missing required field
// ❌ Throws: 'Missing required field: id'
// # speclang-header lines:4
// version: 1.0.0
// layer: 5

// Invalid ID format
// ❌ Throws: 'Spec ID must start with @'
// id: specs/example

// Invalid version
// ❌ Throws: 'Version must be semantic (e.g., 1.0.0)'
// version: v1.0

// Invalid layer
// ❌ Throws: 'Layer must be number 0-10'
// layer: Alpha
```

## Examples

### @poc/header-parser/examples

**Valid Header:**
```markdown
# speclang-header lines:7
id: @specs/auth/login
version: 1.0.0
layer: 5
short: User login functionality
tags: [auth, security]
parent: @ref:specs/auth
---
```

**Parsed Result:**
```typescript
{
  id: '@specs/auth/login',
  version: '1.0.0',
  layer: 5,
  short: 'User login functionality',
  tags: ['auth', 'security'],
  lineCount: 7,
  rawHeader: '# speclang-header lines:7\nid: @specs/auth/login\nversion: 1.0.0\n...'
}
```

**Minimal Header:**
```markdown
# speclang-header lines:5
id: @specs/utils
version: 0.1.0
layer: 3
---
```

## Testing

### @poc/header-parser/testing

```typescript
import { HeaderParser } from './header-parser';
import { POCError } from './errors';

describe('HeaderParser', () => {
  let parser: HeaderParser;
  
  beforeEach(() => {
    parser = new HeaderParser();
  });
  
  it('should parse valid header', () => {
    const content = `# speclang-header lines:6
id: @specs/test
version: 1.0.0
layer: 5
short: Test spec
---
`;
    
    const header = parser.parse(content);
    
    expect(header.id).toBe('@specs/test');
    expect(header.version).toBe('1.0.0');
    expect(header.layer).toBe(5);
    expect(header.short).toBe('Test spec');
  });
  
  it('should throw on missing marker', () => {
    const content = 'Just content';
    
    expect(() => parser.parse(content)).toThrow(POCError);
    expect(() => parser.parse(content)).toThrow('Missing # speclang-header marker');
  });
  
  it('should throw on invalid ID', () => {
    const content = `# speclang-header lines:4
id: invalid-id
version: 1.0.0
layer: 5
---
`;
    
    expect(() => parser.parse(content)).toThrow('Spec ID must start with @');
  });
  
  it('should throw on invalid version', () => {
    const content = `# speclang-header lines:4
id: @specs/test
version: v1
layer: 5
---
`;
    
    expect(() => parser.parse(content)).toThrow('Version must be semantic');
  });
  
  it('should parse array tags', () => {
    const content = `# speclang-header lines:5
id: @specs/test
version: 1.0.0
layer: 5
tags: [a, b, c]
---
`;
    
    const header = parser.parse(content);
    expect(header.tags).toEqual(['a', 'b', 'c']);
  });
});
```

## Integration

### @poc/header-parser/integration

**Used by:**
- `BlockParser` - Parses full spec with header
- `FileWatcher` - Validates spec files
- `SimpleAgent` - Gets spec metadata

**Example Integration:**
```typescript
import { HeaderParser } from './header-parser';
import { BlockParser } from './block-parser';

async function parseSpecFile(filePath: string) {
  const content = await readFile(filePath, 'utf-8');
  
  // Parse header
  const headerParser = new HeaderParser();
  const header = headerParser.parse(content);
  
  // Parse blocks
  const blockParser = new BlockParser();
  const blocks = blockParser.parseBlocks(content);
  
  return {
    ...header,
    filePath,
    blocks,
    parsedAt: Date.now()
  };
}
```
