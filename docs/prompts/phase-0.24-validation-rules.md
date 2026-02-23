# Bootstrap Phase 0.24: Validation Rules

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.24 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.23 complete

## Your Task
Implement the validation rule engine that enforces spec correctness on every write.

## Read These Specs First
1. `specs/validation.spec.dir/rules.spec.md` - Validation rules
2. `specs/validation.spec.md` - Validation overview
3. `specs/headers.spec.md` - Header structure

## What to Build

### Files to Create
```
src/validation/
├── rules/
│   ├── index.ts           # Rule registry
│   ├── header.ts          # Header validation rules
│   ├── id.ts              # ID format validation
│   ├── refs.ts            # Reference validation
│   ├── blocks.ts          # Block validation
│   └── autonomous.ts      # Autonomous mode rules
├── engine.ts              # Rule execution engine
├── types.ts               # Validation types
└── reporter.ts            # Error reporting

tests/validation/
├── rules.test.ts
└── engine.test.ts
```

### Requirements

#### 1. Validation Types (types.ts)
```typescript
interface ValidationRule {
  id: string;              // @validation/header
  name: string;
  level: 'error' | 'warning';
  check: (spec: ParsedSpec) => ValidationResult[];
}

interface ValidationResult {
  rule: string;
  level: 'error' | 'warning';
  location: {
    file: string;
    line: number;
    column?: number;
  };
  message: string;
  suggestion?: string;
}

interface ValidationReport {
  file: string;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  passed: boolean;
}
```

#### 2. Rule Registry (rules/index.ts)
```typescript
class RuleRegistry {
  private rules: Map<string, ValidationRule> = new Map();
  
  register(rule: ValidationRule): void;
  get(id: string): ValidationRule | undefined;
  getAll(): ValidationRule[];
  getByLevel(level: 'error' | 'warning'): ValidationRule[];
}

// Built-in rules
const BUILTIN_RULES: ValidationRule[] = [
  // From rules.spec.md
  headerRule,        // @validation/header
  idRule,            // @validation/id
  refsRule,          // @validation/refs
  blocksRule,        // @validation/blocks
  autonomousRule,    // @validation/autonomous
];
```

#### 3. Header Validation Rule (rules/header.ts)
```typescript
const headerRule: ValidationRule = {
  id: '@validation/header',
  name: 'Header Validation',
  level: 'error',
  
  check(spec: ParsedSpec): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Line 1: Must be comment or blank
    if (spec.lines[0] && !isCommentOrBlank(spec.lines[0])) {
      results.push(error(1, 'Line 1 must be comment or blank'));
    }
    
    // Line 2: Must contain speclang-header declaration
    if (!spec.lines[1]?.includes('speclang-header')) {
      results.push(error(2, 'Missing speclang-header declaration'));
    }
    
    // Required fields
    if (!spec.metadata.id) {
      results.push(error('header', 'Missing required field: id'));
    }
    if (!spec.metadata.version) {
      results.push(error('header', 'Missing required field: version'));
    }
    
    return results;
  }
};
```

#### 4. ID Validation Rule (rules/id.ts)
```typescript
const idRule: ValidationRule = {
  id: '@validation/id',
  name: 'ID Format Validation',
  level: 'error',
  
  check(spec: ParsedSpec): ValidationResult[] {
    const results: ValidationResult[] = [];
    const id = spec.metadata.id;
    
    if (!id) return results;
    
    // Must start with @
    if (!id.startsWith('@')) {
      results.push(error('header', 'ID must start with @'));
    }
    
    // Domain must be lowercase
    const parts = id.slice(1).split('/');
    if (parts[0] !== parts[0]?.toLowerCase()) {
      results.push(error('header', 'Domain must be lowercase'));
    }
    
    // Path uses forward slashes
    if (id.includes('\\')) {
      results.push(error('header', 'Path must use forward slashes'));
    }
    
    // No special chars except - and _
    const invalidChars = id.match(/[^a-zA-Z0-9@\/\-_]/);
    if (invalidChars) {
      results.push(error('header', `Invalid character in ID: ${invalidChars[0]}`));
    }
    
    return results;
  }
};
```

#### 5. Reference Validation Rule (rules/refs.ts)
```typescript
const refsRule: ValidationRule = {
  id: '@validation/refs',
  name: 'Reference Validation',
  level: 'error',
  
  check(spec: ParsedSpec, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    for (const ref of spec.refs) {
      // Target file must exist
      const targetPath = resolveRefPath(ref, spec.filepath);
      if (!context.fileExists(targetPath)) {
        results.push(error(ref.line, `Reference target not found: ${ref.target}`));
      }
      
      // Target block must exist (if specified)
      if (ref.blockId) {
        const targetSpec = context.getSpec(targetPath);
        if (targetSpec && !targetSpec.hasBlock(ref.blockId)) {
          results.push(error(ref.line, `Block not found: ${ref.blockId}`));
        }
      }
    }
    
    // Check for circular refs
    const cycles = detectCycles(spec, context.dependencyGraph);
    for (const cycle of cycles) {
      results.push(error('refs', `Circular dependency: ${cycle.join(' -> ')}`));
    }
    
    return results;
  }
};
```

#### 6. Block Validation Rule (rules/blocks.ts)
```typescript
const blocksRule: ValidationRule = {
  id: '@validation/blocks',
  name: 'Block Validation',
  level: 'error',
  
  check(spec: ParsedSpec): ValidationResult[] {
    const results: ValidationResult[] = [];
    const seenIds = new Set<string>();
    
    for (const block of spec.blocks) {
      // ID must be unique
      if (seenIds.has(block.id)) {
        results.push(error(block.line, `Duplicate block ID: ${block.id}`));
      }
      seenIds.add(block.id);
      
      // Kind must be valid
      const validKinds = ['entity', 'operation', 'test', 'note', 'code', 'table', 'diagram'];
      if (!validKinds.includes(block.kind)) {
        results.push(error(block.line, `Invalid block kind: ${block.kind}`));
      }
    }
    
    return results;
  }
};
```

#### 7. Autonomous Validation Rule (rules/autonomous.ts)
```typescript
const autonomousRule: ValidationRule = {
  id: '@validation/autonomous',
  name: 'Autonomous Mode Validation',
  level: 'error',
  
  check(spec: ParsedSpec): ValidationResult[] {
    // Only applies to agent_autonomous specs
    if (spec.metadata.agent_support !== 'agent_autonomous') {
      return [];
    }
    
    const results: ValidationResult[] = [];
    
    // Step-by-step descriptions for all operations
    for (const block of spec.blocks.filter(b => b.kind === 'operation')) {
      if (!hasStepByStepDescription(block)) {
        results.push(warning(block.line, 
          `Operation ${block.id} lacks step-by-step description`));
      }
    }
    
    // All references must resolve
    // (covered by refsRule, but flag extra for autonomous)
    
    // No ambiguous natural language
    const ambiguousPatterns = detectAmbiguity(spec.content);
    for (const match of ambiguousPatterns) {
      results.push(warning(match.line, 
        `Potentially ambiguous language: "${match.text}"`));
    }
    
    // Required metadata fields
    const requiredForAutonomous = ['layer', 'project_level', 'tags'];
    for (const field of requiredForAutonomous) {
      if (!spec.metadata[field]) {
        results.push(error('header', 
          `Autonomous spec missing required field: ${field}`));
      }
    }
    
    return results;
  }
};
```

#### 8. Rule Engine (engine.ts)
```typescript
class ValidationEngine {
  private registry: RuleRegistry;
  
  constructor() {
    this.registry = new RuleRegistry();
    this.registerBuiltinRules();
  }
  
  async validate(spec: ParsedSpec, context: ValidationContext): Promise<ValidationReport> {
    const allResults: ValidationResult[] = [];
    
    // Run all rules
    for (const rule of this.registry.getAll()) {
      const results = rule.check(spec, context);
      allResults.push(...results);
    }
    
    // Separate errors and warnings
    const errors = allResults.filter(r => r.level === 'error');
    const warnings = allResults.filter(r => r.level === 'warning');
    
    return {
      file: spec.filepath,
      errors,
      warnings,
      passed: errors.length === 0
    };
  }
  
  async validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]> {
    const context = await this.buildContext(specs);
    return Promise.all(specs.map(s => this.validate(s, context)));
  }
}
```

#### 9. Error Reporter (reporter.ts)
```typescript
class ValidationReporter {
  format(report: ValidationReport): string {
    const lines: string[] = [];
    
    lines.push(`\n${report.file}`);
    lines.push('─'.repeat(40));
    
    if (report.passed) {
      lines.push('✓ Passed');
      if (report.warnings.length > 0) {
        lines.push(`  ${report.warnings.length} warnings`);
      }
    } else {
      for (const error of report.errors) {
        lines.push(`✗ ${error.location.line}: ${error.message}`);
        if (error.suggestion) {
          lines.push(`  Suggestion: ${error.suggestion}`);
        }
      }
    }
    
    return lines.join('\n');
  }
  
  formatSummary(reports: ValidationReport[]): string {
    const passed = reports.filter(r => r.passed).length;
    const failed = reports.length - passed;
    const totalErrors = reports.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = reports.reduce((sum, r) => sum + r.warnings.length, 0);
    
    return `
Validation Summary
─────────────────
Passed:   ${passed}
Failed:   ${failed}
Errors:   ${totalErrors}
Warnings: ${totalWarnings}
`;
  }
}
```

### Custom Rule Support
```typescript
// Allow users to add custom rules
interface CustomRuleConfig {
  path: string;           // Path to custom rule module
  enabled: boolean;
}

// .speclang/config.yaml
validation:
  custom_rules:
    - path: ./rules/my-custom-rule.ts
      enabled: true
```

## Test Cases
1. Valid header passes
2. Invalid header format fails
3. Invalid ID format fails
4. Missing reference fails
5. Circular reference fails
6. Duplicate block ID fails
7. Invalid block kind fails
8. Autonomous spec with ambiguity warns
9. Autonomous spec missing fields fails
10. Custom rules integrate

## CLI Commands
```bash
# Validate all specs
speclang validate

# Validate specific file
speclang validate specs/auth.spec.md

# Show warnings
speclang validate --warnings

# JSON output
speclang validate --json
```

## Validation
```bash
bun test tests/validation/
```

## Output Format
After completing, output:
1. Rules implemented
2. Rule coverage (headers, IDs, refs, blocks, autonomous)
3. Test results
