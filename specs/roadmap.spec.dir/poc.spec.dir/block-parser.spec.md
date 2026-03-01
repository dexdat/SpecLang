# speclang-header lines:15
id: "@speclang/roadmap/poc/block-parser"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "Parse @block: definitions from markdown specs"
tags: [poc, parser, blocks, markdown]
---

# POC: Block Parser

Parse `@block:` definitions from markdown specs for code generation.

## Purpose

Extract structured information from spec blocks so SimpleAgent can generate code.

## Input Format

### @poc/block-parser/input

**Markdown Block:**
```markdown
### @block:greet @kind:function
Greets a user by name.

**Parameters:**
- name: string - The user's name

**Returns:** string - A greeting message

**Example:**
```typescript
greet("Alice") // "Hello, Alice!"
```
```

## Output Format

### @poc/block-parser/output

**Parsed Block:**
```typescript
interface ParsedBlock {
  id: string;           // "greet"
  kind: BlockKind;      // "function"
  description: string;  // "Greets a user by name."
  parameters: Parameter[];
  returns?: ReturnType;
  examples?: CodeExample[];
}

interface Parameter {
  name: string;         // "name"
  type: string;         // "string"
  description: string;   // "The user's name"
}

interface ReturnType {
  type: string;         // "string"
  description: string;   // "A greeting message"
}
```

## Parsing Logic

### @poc/block-parser/logic

**Step 1: Find Block Headers**
```typescript
// Pattern: ### @block:{id} @kind:{kind}
const blockPattern = /^###\s+@block:(\w+)\s+@kind:(\w+)/gm;
```

**Step 2: Extract Sections**
```typescript
// Extract content until next ### or EOF
// Look for:
// - Description (text after header)
// - **Parameters:** section
// - **Returns:** section
// - **Example:** section
```

**Step 3: Parse Parameters**
```typescript
// Pattern: - name: type - description
const paramPattern = /^-\s+(\w+):\s+(\w+)\s+-\s+(.+)$/gm;
```

## Implementation

### @poc/block-parser/impl

```typescript
import { readFile } from 'fs/promises';
import { 
  ParsedBlock, 
  ParsedSpec, 
  BlockKind, 
  Parameter, 
  Property,
  ReturnType, 
  CodeExample,
  SpecHeader 
} from './types';
import { HeaderParser } from './header-parser';

/**
 * Parser for spec markdown files
 * Extracts @block: definitions and spec headers
 */
export class BlockParser {
  // Block ID allows: letters, numbers, underscores, hyphens
  private readonly blockPattern = /^###\s+@block:([a-zA-Z0-9_-]+)\s+@kind:(\w+)/gm;
  
  // Parameter: name (optional ?), type (complex types allowed), description
  // Supports: string, string[], Promise<string>, Array<T>, string | number, { a: string }
  // Pattern captures everything up to " - " as type, allowing complex TypeScript types
  private readonly paramPattern = /^-\s+(\w+\??):\s*(.+?)\s+-\s*(.+)$/gm;
  
  // Return type: captures complex types including generics, unions, intersections
  // Supports: string, Promise<string>, string | number, Array<T>, { [key: string]: any }
  private readonly returnPattern = /\*\*Returns:\*\*\s*([^\n]+?)(?:\s+-\s*(.+))?$/m;
  
  // Code examples
  private readonly examplePattern = /```(\w+)\n([\s\S]*?)```/g;
  
  private headerParser: HeaderParser;
  
  constructor() {
    this.headerParser = new HeaderParser();
  }
  
  /**
   * Parse a spec file
   * @param filePath - Path to the spec file
   * @returns Complete parsed spec with header and blocks
   * @throws {POCError} If file cannot be read or parsed
   */
  async parseFile(filePath: string): Promise<ParsedSpec> {
    const content = await readFile(filePath, 'utf-8');
    return this.parse(content, filePath);
  }
  
  /**
   * Parse spec content
   * @param content - Raw markdown content
   * @param filePath - Source file path (for metadata)
   * @returns Complete parsed spec
   */
  parse(content: string, filePath: string): ParsedSpec {
    // Parse header
    const header = this.headerParser.parse(content);
    
    // Parse blocks
    const blocks = this.parseBlocks(content);
    
    return {
      id: header.id,
      version: header.version,
      short: header.short,
      filePath,
      blocks,
      headerLines: header.rawHeader.split('\n'),
      parsedAt: Date.now()
    };
  }
  
  /**
   * Parse all blocks from content
   * @param content - Markdown content
   * @returns Array of parsed blocks
   */
  parseBlocks(content: string): ParsedBlock[] {
    const blocks: ParsedBlock[] = [];
    const matches = content.matchAll(this.blockPattern);
    
    for (const match of matches) {
      const block = this.parseBlock(match, content);
      blocks.push(block);
    }
    
    return blocks;
  }
  
  /**
   * Parse a single block
   * @param match - RegExp match array from block pattern
   * @param fullContent - Full file content
   * @returns Parsed block
   */
  private parseBlock(match: RegExpMatchArray, fullContent: string): ParsedBlock {
    const id = match[1];
    const kind = match[2] as BlockKind;
    const section = this.extractSection(match.index!, fullContent);
    
    return {
      id,
      kind,
      description: this.parseDescription(section),
      parameters: this.parseParameters(section),
      properties: this.parseProperties(section),
      returns: this.parseReturns(section),
      examples: this.parseExamples(section),
      rawContent: section
    };
  }
  
  /**
   * Extract section content until next block or EOF
   */
  private extractSection(startIndex: number, content: string): string {
    const endPattern = /^###\s+@block:/m;
    const remaining = content.slice(startIndex);
    const match = remaining.match(endPattern);
    
    if (match && match.index !== undefined) {
      return remaining.slice(0, match.index).trim();
    }
    
    return remaining.trim();
  }
  
  /**
   * Parse block description (text after header, before params)
   */
  private parseDescription(section: string): string {
    const lines = section.split('\n');
    const descriptionLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('**') && !trimmed.startsWith('-')) {
        descriptionLines.push(trimmed);
      } else if (trimmed.startsWith('**')) {
        break;
      }
    }
    
    return descriptionLines.join(' ').trim();
  }
  
  /**
   * Parse parameters section
   * Handles: "name: string - description", "name?: string - optional param"
   */
  private parseParameters(section: string): Parameter[] {
    const params: Parameter[] = [];
    const paramSection = section.match(/\*\*Parameters:\*\*([\s\S]*?)(?=\*\*|$)/);
    
    if (!paramSection) return params;
    
    // Reset regex lastIndex
    this.paramPattern.lastIndex = 0;
    
    let match;
    while ((match = this.paramPattern.exec(paramSection[1])) !== null) {
      const rawName = match[1];
      const isOptional = rawName.endsWith('?');
      const name = isOptional ? rawName.slice(0, -1) : rawName;
      
      params.push({
        name,
        type: match[2].trim(),
        description: match[3].trim(),
        optional: isOptional
      });
    }
    
    return params;
  }
  
  /**
   * Parse properties section (for classes/interfaces)
   * Handles: "name: type - description"
   */
  private parseProperties(section: string): Property[] {
    const properties: Property[] = [];
    const propSection = section.match(/\*\*Properties:\*\*([\s\S]*?)(?=\*\*|$)/);
    
    if (!propSection) return properties;
    
    const lines = propSection[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^-\s+(\w+\??):\s*(.+?)\s+-\s*(.+)$/);
      if (match) {
        const rawName = match[1];
        const isOptional = rawName.endsWith('?');
        const name = isOptional ? rawName.slice(0, -1) : rawName;
        
        properties.push({
          name,
          type: match[2].trim(),
          description: match[3].trim(),
          optional: isOptional
        });
      }
    }
    
    return properties;
  }
  
  /**
   * Parse return type
   */
  private parseReturns(section: string): ReturnType | undefined {
    const match = section.match(this.returnPattern);
    if (match) {
      return {
        type: match[1],
        description: match[2].trim()
      };
    }
    return undefined;
  }
  
  /**
   * Parse code examples
   */
  private parseExamples(section: string): CodeExample[] {
    const examples: CodeExample[] = [];
    const matches = section.matchAll(this.examplePattern);
    
    for (const match of matches) {
      examples.push({
        language: match[1] || 'typescript',
        code: match[2].trim(),
        description: ''  // Could parse from preceding text
      });
    }
    
    return examples;
  }
}
```

## Edge Cases

### @poc/block-parser/edge-cases

- **No parameters**: Function takes no arguments
- **No returns**: Procedure/void function
- **Multiple examples**: Parse all code blocks
- **Missing description**: Use empty string
- **Nested markdown**: Handle correctly

## Testing

### @poc/block-parser/testing

```typescript
const input = `
### @block:hello @kind:function
Say hello.

**Parameters:**
- name: string - Who to greet
**Returns:** string - The greeting
`;

const result = parser.parse(input);
expect(result).toHaveLength(1);
expect(result[0].id).toBe('hello');
expect(result[0].parameters).toHaveLength(1);
```
