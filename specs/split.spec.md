# speclang-header lines:12
id: "@specs/split"
version: 1.0.0
target: src/split/
layer: 3
project_level: Alpha
agent_support: agent_assisted
tags: [split, implementation]
short: Implementation wrapper for split module
depends_on:
  - ""@ref:specs/dynamic-split"  - ""@ref:specs/core"---

This is an implementation wrapper spec. The actual specification is defined in `@speclang/dynamic-split`.

## Implementation

Implementation files are stored in `split.spec.dir/src/` and symlinked to `src/split/`.

### @block::module-structure @kind:prose

The split module provides automatic spec splitting when files exceed size limits:

```
specs/large.spec.md           → Original (split)
specs/large.spec.dir/         → New directory
specs/large.spec.dir/main.spec.md  → Main content
specs/large.spec.dir/entities.spec.md  → Entities
specs/large.spec.dir/api.spec.md  → API definitions
```

### @block::triggers @kind:entity

SplitTriggers:
  size_limits:
    max_lines: 500
    max_chars: 50000
    max_tokens: 12500

  content_types:
    - Multiple @block: sections (>5)
    - Large entity definitions
    - Extensive prose sections

### @block::process @kind:function

```typescript
interface SplitProcessor {
  // Check if spec needs splitting
  needsSplit(spec: Spec): boolean

  // Perform the split operation
  split(spec: Spec): SplitResult

  // Update references in child specs
  updateReferences(parent: Spec, children: Spec[]): void

  // Create parent stub that references children
  createParentStub(parent: Spec, children: Spec[]): Spec
}
```

### @block::dual-view @kind:prose

Following the dual-view pattern:

- **Source of truth**: `specs/split.spec.dir/src/`
- **Working location**: `src/split/` (symlink)

Implementation details are in the spec directory, generated code appears in src/.

## References
@ref:specs/dynamic-split
