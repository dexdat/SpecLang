# Bootstrap Phase 0.2: Header Parser & Validator

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.2 of the bootstrap process.

**Prerequisite**: Phase 0.1 (SQLite Database) must be complete.

## Your Task
Implement the spec header parser and validator. Every spec file has a header that declares its identity, dependencies, and metadata.

## Read These Specs First
1. `specs/headers.spec.md` - Universal header format
2. `specs/spec-format.spec.md` - Overall spec structure  
3. `specs/file-naming.spec.md` - File naming conventions

## What to Build

### Files to Create
```
src/parser/
├── index.ts          # Main exports
├── header.ts         # Header parsing
├── validator.ts      # Validation logic
└── types.ts          # Parser types

tests/
└── parser.test.ts    # Parser tests
```

### Requirements

#### 1. Header Format (from headers.spec.md)
```yaml
# speclang-header lines:12
id: @specs/example
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_assisted
tags: [example, docs]
short: Brief description
depends_on:
  - @ref:specs/other#block
---
```

#### 2. Parse Function
```typescript
interface ParsedSpec {
  headerLines: number;
  metadata: SpecMetadata;
  content: string;
  blocks: Block[];
}

function parseSpec(filepath: string): ParsedSpec;
```

#### 3. Validation Rules
- `id` must match file path convention
- `version` must be semver
- `layer` must be 0-10
- `project_level` must be valid enum value
- All `@ref:` in depends_on must exist in `_index.json`
- Header line count must match `lines:N` declaration

#### 4. Reference Extraction
```typescript
interface Reference {
  ref: string;           // @specs/auth#login
  sourceFile: string;    // current file
  targetFile?: string;   // specs/auth.spec.md
  targetBlock?: string;  // login
  line: number;          // where it appears
}

function extractReferences(content: string): Reference[];
```

#### 5. Block Extraction
```typescript
interface Block {
  id: string;        // @block:auth/login
  kind: string;      // entity, code, diagram, note
  content: string;   // block content
  line: number;      // starting line
}

function extractBlocks(content: string): Block[];
```

### Validation Functions
```typescript
// Validate single spec
function validateSpec(filepath: string): ValidationResult;

// Validate all specs
function validateAllSpecs(): ValidationReport;

// Check reference integrity
function checkReferences(filepath: string): ReferenceCheck[];
```

## Example Usage
```typescript
import { parseSpec, validateSpec } from './parser';

const spec = parseSpec('specs/auth.spec.md');
console.log(spec.metadata.id);  // @specs/auth

const validation = validateSpec('specs/auth.spec.md');
if (!validation.valid) {
  console.log(validation.errors);
}
```

## Test Cases
1. Parse valid header with all fields
2. Parse header with minimal fields
3. Reject header with invalid `lines:N`
4. Detect missing required fields
5. Detect invalid @ref: targets
6. Extract all block definitions
7. Handle malformed YAML gracefully

## Validation
```bash
bun test tests/parser.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Test coverage summary
3. Any ambiguities found in specs
