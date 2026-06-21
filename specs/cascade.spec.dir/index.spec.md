# speclang-header lines:11
id: "@specs/cascade/implementation"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [cascade, implementation, code]
target: src/cascade/index.ts
short: Cascade system implementation
refs: ["@ref:specs/cascade"]
---

# Cascade Implementation

Implementation of the reactive cascade system that reads spec files, generates code, runs tests, and detects convergence.

## Overview

The cascade system provides:
1. Spec file parsing and validation
2. Code generation from spec blocks
3. Test execution
4. Convergence detection

## Core Functions

### @block::run-cascade @kind:operation

**Purpose:** Main entry point for running cascades on spec files.

**Parameters:**
- `specPath: string` - Path to the spec file
- `options: CascadeOptions` - Configuration options

**Returns:** `Promise<CascadeResult>` with success status, generated files, test results, and convergence info.

**Steps:**
1. Validate spec file exists
2. Read and parse spec content
3. Determine output directory
4. Generate code from spec blocks
5. Run generated tests
6. Check convergence (tests pass = converged)

### @block::parse-spec @kind:operation

**Purpose:** Parse a spec file and extract metadata and blocks.

**Steps:**
1. Split content into lines
2. Detect speclang-header and extract metadata
3. Parse block definitions (`### @block::name @kind:type`)
4. Extract code blocks (```typescript ... ```)
5. Return structured spec object

### @block::generate-code @kind:operation

**Purpose:** Generate code files from spec blocks.

**Steps:**
1. Iterate through spec blocks
2. Skip test blocks (handled separately)
3. Only process TypeScript/code blocks
4. Generate filename from block name
5. Add auto-generated header with source reference
6. Write file to output directory

### @block::run-tests @kind:operation

**Purpose:** Execute generated test files using vitest.

**Steps:**
1. Filter for test files (.test.ts)
2. Execute vitest on test files
3. Parse JSON output for results
4. Return total, passed, failed counts

## Types

### @block::types @kind:entity

```typescript
interface CascadeOptions {
  verbose?: boolean;
  maxDepth?: number;
  convergenceTimeout?: number; // ms
}

interface CascadeResult {
  success: boolean;
  filesGenerated: string[];
  testsRun: number;
  testsPassed: number;
  converged: boolean;
  convergenceTime?: number;
  error?: string;
}

interface SpecBlock {
  name: string;
  kind: string;
  language?: string;
  code: string;
}
```

## Submodules

### @block::coordinator @kind:entity

The coordinator manages cascade execution, dependency tracking, and state.

**Files:**
- `src/coordinator/index.ts` - Main coordinator
- `src/coordinator/dependency.ts` - Dependency graph tracking
- `src/coordinator/invocation.ts` - Agent invocation
- `src/coordinator/state.ts` - Cascade state management
- `src/coordinator/verification.ts` - Verification gates

### @block::triggers @kind:entity

The triggers module handles file system watching and event routing.

**Files:**
- `src/triggers/index.ts` - Trigger exports
- `src/triggers/handlers.ts` - Event handlers
- `src/triggers/router.ts` - Event routing
- `src/triggers/sources.ts` - Event sources
- `src/triggers/types.ts` - Trigger types
- `src/triggers/watcher.ts` - File watcher

### @block::depth @kind:entity

The depth module handles cascade depth limits, cycle detection, and convergence.

**Files:**
- `src/depth/index.ts` - Depth management
- `src/depth/convergence.ts` - Convergence detection
- `src/depth/cycle-detection.ts` - Cycle prevention
- `src/depth/limits.ts` - Depth limits
- `src/depth/termination.ts` - Termination logic
- `src/depth/tracker.ts` - Depth tracking
- `src/depth/types.ts` - Depth types
