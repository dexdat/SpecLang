# Bootstrap Phase 3.4: Compiler Phases

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 3.4 of the bootstrap process.

**Prerequisite**: Phases 3.1-3.3 (Codegen, Templates, Targets) must be complete.

## Your Task
Implement the compiler phases that transform specs into code. Multi-target, bidirectional sync.

## Read These Specs First
1. `specs/compiler.spec.dir/phases.spec.md` - Compiler phases and features
2. `specs/compiler.spec.dir/templates.spec.md` - Template system
3. `specs/compiler.spec.dir/targets.spec.md` - Target languages

## What to Build

### Files to Create
```
src/compiler/
├── phases/
│   ├── index.ts        # Phase orchestration
│   ├── parse.ts        # Parse phase
│   ├── validate.ts     # Validate phase
│   ├── resolve.ts      # Resolve phase
│   ├── transform.ts    # Transform phase
│   └── codegen.ts      # Codegen phase
├── sync/
│   ├── detect-drift.ts # Drift detection
│   ├── sync-code.ts    # Code -> Spec sync
│   └── sync-spec.ts    # Spec -> Code sync
├── incremental.ts      # Incremental compilation
├── cache.ts            # Compile cache
└── plugins.ts          # Plugin system

tests/
└── compiler/phases.test.ts
```

### Requirements

#### 1. Pipeline Phases
```typescript
// Phase 1: Parse
function parse(sources: File[]): SpecGraph {
  // 1. Read each file
  // 2. Extract header
  // 3. Parse blocks
  // 4. Extract refs
  // 5. Build graph
}

// Phase 2: Validate
function validate(graph: SpecGraph): ValidationResult {
  // - header format valid
  // - block IDs unique
  // - refs point to existing blocks
  // - kind-specific syntax valid
  // - no circular deps (or marked intentional)
}

// Phase 3: Resolve
function resolve(graph: SpecGraph): ResolvedGraph {
  // 1. Expand imports
  // 2. Inline stdlib refs
  // 3. Calculate dependency order
  // 4. Type all expressions
  // 5. Bind all refs
}

// Phase 4: Transform
function transform(graph: ResolvedGraph, target: Target): IR {
  // 1. Lower to target-agnostic IR
  // 2. Apply target-specific transforms
  // 3. Optimize
  // 4. Prepare for codegen
}

// Phase 5: Codegen
function codegen(ir: IR, target: Target): Artifact[] {
  // targets: typescript, go, rust, python, openapi, jsonschema
}
```

#### 2. Bidirectional Sync
```typescript
// Detect drift between spec and generated code
function detectDrift(spec: SpecGraph, files: File[]): DriftReport {
  // 1. Parse generated file markers
  // 2. Compare with current spec
  // 3. Detect manual edits
  // 4. Detect spec changes
  // Output: spec_ahead | code_ahead | in_sync
}

// Sync code changes back to spec
function syncCodeToSpec(code: Code, spec: Block): BlockUpdate;

// Sync spec changes to code
function syncSpecToCode(spec: Block, code: Code): CodeUpdate;
```

#### 3. Incremental Compilation
```typescript
function compileIncremental(
  graph: SpecGraph, 
  changed: BlockId[]
): Artifact[] {
  // 1. Find transitive deps of changed blocks
  // 2. Only recompile affected scope
  // 3. Reuse cached IR where possible
  // 4. Write only changed artifacts
}

// Cache at .speclang/cache
interface CompileCache {
  location: '.speclang/cache';
  entries: {
    blockId: string;
    irHash: string;
    artifactHash: string;
  }[];
}
```

#### 4. Plugin API
```typescript
interface CompilerPlugin {
  name: string;
  version: string;
  hooks: {
    beforeParse?(source: string): string;
    afterParse?(graph: SpecGraph): SpecGraph;
    beforeValidate?(graph: SpecGraph): SpecGraph;
    afterValidate?(result: ValidationResult): ValidationResult;
    beforeTransform?(ir: IR): IR;
    beforeCodegen?(ir: IR, target: Target): IR;
    afterCodegen?(artifacts: Artifact[]): Artifact[];
  };
}
```

#### 5. Error Handling
```typescript
interface CompileError {
  code: string;          // E001, E002
  message: string;
  location: Location;
  block?: BlockId;
  suggestions: string[];
}

// Error codes:
// E001: Invalid header
// E002: Missing header
// E003: Duplicate block ID
// E004: Unresolved ref
// E005: Invalid block syntax
// E006: Circular dependency
// E007: Type mismatch
// E008: Unknown kind
```

## Phase Dependencies
```
Parse → Validate → Resolve → Transform → Codegen
                    ↓
              Incremental ← Cache
                    ↓
              Sync (bidirectional)
```

## Test Cases
1. Parse spec files to SpecGraph
2. Validate detects duplicate IDs
3. Resolve expands imports
4. Transform produces correct IR
5. Codegen outputs valid code
6. Drift detection works
7. Incremental only recompiles changed
8. Plugins can hook into phases

## Validation
```bash
bun test tests/compiler/phases.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Phase implementations
3. Sync bidirectional test results
