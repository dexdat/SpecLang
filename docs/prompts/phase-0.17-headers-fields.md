# Bootstrap Phase 0.17: Header Field Definitions

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.17 of the bootstrap process.

**Prerequisite**: Phase 0.2 (Parser) must be complete.

## Your Task
Implement comprehensive header field definitions with validation. Every spec file has a header that declares its identity, dependencies, and metadata.

## Read These Specs First
1. `specs/headers.spec.md` - Universal header format with field definitions

## What to Build

### Files to Create
```
src/parser/
├── fields.ts          # Field definitions
├── field-types.ts     # TypeScript types for fields
└── field-validator.ts # Field-level validation

tests/
└── fields.test.ts     # Field validation tests
```

### Requirements

#### 1. Required Fields
```typescript
const REQUIRED_FIELDS = {
  id: {
    type: '@domain/path',
    pattern: /^@[a-z0-9-]+\/[a-z0-9-/]+$/,
    example: '@specs/auth/login'
  },
  version: {
    type: 'semver',
    pattern: /^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/,
    example: '1.0.0'
  }
};
```

#### 2. Relationship Fields
```typescript
interface RelationshipFields {
  depends_on?: string[];   // @ref:speclang/auth/flows#middleware-flow
  refs?: string[];         // outgoing links
  children?: string[];     // sub-specs in .spec.dir/
  parent?: string;         // @ref:speclang/auth
}
```

#### 3. Metadata Fields
```typescript
interface MetadataFields {
  layer?: number;          // 0-10 abstraction depth
  project_level?: ProjectLevel;
  agent_support?: AgentSupport;
  tags?: string[];
  short?: string;          // one-line description
  target?: string;         // go, ts, python
  status?: 'draft' | 'stable' | 'deprecated';
}

type ProjectLevel = 
  | 'POC' | 'MVP' | 'Alpha' | 'Beta' | 'Production'
  | 'Startup' | 'SMB' | 'MSB' | 'Enterprise';

type AgentSupport = 
  | 'human_only' 
  | 'agent_assisted' 
  | 'agent_autonomous';
```

#### 4. Ownership Fields
```typescript
interface OwnershipFields {
  owned_by?: string;       // agent-name
  session_id?: string;     // uuid
}
```

#### 5. Efficiency Fields
```typescript
interface EfficiencyFields {
  lines?: number;          // header line count
  line_count?: number;     // computed for validation
}
```

### Field Validation Rules
```typescript
function validateField(name: string, value: unknown): FieldValidationResult {
  // id: must match @domain/path pattern
  // version: must be valid semver
  // layer: must be 0-10
  // project_level: must be valid enum
  // agent_support: must be valid enum
  // depends_on: each ref must be valid @ref: format
  // tags: must be array of lowercase strings
}
```

## Test Cases
1. Validate required fields present
2. Validate id format matches @domain/path
3. Validate version is semver
4. Validate layer range (0-10)
5. Validate project_level enum values
6. Validate agent_support enum values
7. Validate depends_on refs format
8. Warn on unknown fields

## Validation
```bash
bun test tests/fields.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Test coverage summary
3. Field validation matrix
