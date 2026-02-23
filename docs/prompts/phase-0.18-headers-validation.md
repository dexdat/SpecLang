# Bootstrap Phase 0.18: Header Validation Rules

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.18 of the bootstrap process.

**Prerequisite**: Phase 0.17 (Header Fields) must be complete.

## Your Task
Implement header validation rules with comprehensive error messages and recovery suggestions.

## Read These Specs First
1. `specs/headers.spec.md` - Header validation section

## What to Build

### Files to Create
```
src/parser/
├── header-validator.ts    # Full header validation
├── validation-messages.ts # Error/warning messages
└── validation-recovery.ts # Auto-fix suggestions

tests/
└── header-validation.test.ts
```

### Requirements

#### 1. Validation on Edit
```typescript
interface HeaderValidation {
  on_edit: {
    checks: [
      'required_fields_present',    // id, version
      'id_format_valid',             // @domain/path
      'version_semver',              // x.y.z
      'depends_on_refs_exist',       // warn if not
      'owned_by_valid_agent',        // registered?
      'lines_matches_actual',        // if lines:N present
    ];
  };
}
```

#### 2. Validation Result
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: FixSuggestion[];
}

interface ValidationError {
  code: string;           // E001, E002
  message: string;
  field?: string;
  line?: number;
  fix?: string;
}

interface ValidationWarning {
  code: string;           // W001, W002
  message: string;
  field?: string;
  suggestion: string;
}
```

#### 3. Error Codes
```typescript
const ERROR_CODES = {
  E001: 'Invalid header format',
  E002: 'Missing required field: id',
  E003: 'Missing required field: version',
  E004: 'Invalid id format (expected @domain/path)',
  E005: 'Invalid version (expected semver)',
  E006: 'Invalid layer (must be 0-10)',
  E007: 'Invalid project_level value',
  E008: 'Invalid agent_support value',
};

const WARNING_CODES = {
  W001: 'lines:N missing on large file',
  W002: 'depends_on ref does not exist',
  W003: 'owned_by agent not registered',
  W004: 'Unknown field in header',
};
```

#### 4. Recovery Actions
```typescript
interface RecoveryActions {
  on_failure: [
    'log_error',
    'block_cascade',      // optional
    'notify_orchestrator',
  ];
  
  recovery: [
    'suggest_fixes',
    'auto_format_if_possible',
    'suggest_adding_lines',
  ];
}
```

#### 5. Validation Functions
```typescript
// Validate header structure
function validateHeaderStructure(
  header: Record<string, unknown>
): ValidationResult;

// Validate lines:N matches actual
function validateLineCount(
  declared: number,
  actual: number
): ValidationResult;

// Check reference integrity
function validateReferences(
  refs: string[],
  index: SpecIndex
): ReferenceValidation;
```

## Test Cases
1. Valid header passes all checks
2. Missing id returns E002
3. Invalid id format returns E004
4. Invalid version returns E005
5. Layer out of range returns E006
6. Missing lines:N on large file warns W001
7. Non-existent ref warns W002
8. Auto-fix suggestions generated

## Validation
```bash
bun test tests/header-validation.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Error code coverage
3. Sample validation outputs
