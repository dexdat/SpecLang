# Bootstrap Phase 0.3: Spec Index Generator

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.3 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1 (SQLite Database) complete
- Phase 0.2 (Header Parser) complete

## Your Task
Enhance the spec indexer to build a complete reference graph of all specs. The index is the brain of SpecLang - it knows every spec, every reference, and every dependency.

## Read These Specs First
1. `specs/project-layout.spec.md` - Project structure
2. `specs/headers.spec.md` - Header format
3. Existing `generate_index.py` - Current implementation

## What to Build

### Files to Create/Enhance
```
scripts/generate_index.py  # Enhance existing
src/indexer/
├── index.ts              # TypeScript version
├── graph.ts              # Reference graph builder
└── analyzer.ts           # Analysis utilities

_index.json               # Output (generated)
```

### Requirements

#### 1. Index Structure
```typescript
interface SpecIndex {
  version: string;
  generated: string;
  specs: {
    [id: string]: SpecEntry;
  };
  graph: {
    dependencies: { [id: string]: string[] };  // what X depends on
    dependents: { [id: string]: string[] };    // what depends on X
  };
  orphans: string[];      // specs with no refs to/from
  cycles: string[][];     // circular dependency chains
}

interface SpecEntry {
  id: string;
  file: string;
  version: string;
  layer: number;
  tags: string[];
  short: string;
  depends_on: string[];
  blocks: string[];
  lastModified: string;
}
```

#### 2. Graph Operations
```typescript
// Get all specs that X depends on (transitive)
function getDependencies(specId: string): string[];

// Get all specs that depend on X (transitive)
function getDependents(specId: string): string[];

// Find shortest path between two specs
function findPath(from: string, to: string): string[];

// Detect cycles in dependency graph
function detectCycles(): string[][];

// Find specs not connected to main graph
function findOrphans(): string[];
```

#### 3. Impact Analysis
```typescript
// If I change spec X, what else might need to change?
function impactAnalysis(specId: string): {
  direct: string[];       // immediate dependents
  transitive: string[];   // all downstream effects
  files: string[];        // actual file paths affected
};
```

#### 4. Validation Checks
- All `@ref:` targets exist
- No orphan specs (unless explicitly marked)
- No cycles in dependency graph
- All specs have valid headers
- Layer values are consistent with hierarchy

#### 5. CLI Commands
```bash
# Generate index
speclang index

# Validate index
speclang index --validate

# Show dependency tree for spec
speclang index --tree @specs/auth

# Show impact of change
speclang index --impact @specs/auth
```

### Integration with SQLite
The indexer should populate the SQLite database:
- `specs` table → all spec metadata
- `blocks` table → all block definitions
- `refs` table → all @ref: connections

### Example Output (_index.json)
```json
{
  "version": "0.2.0",
  "generated": "2024-01-15T10:30:00Z",
  "specs": {
    "@specs/auth": {
      "id": "@specs/auth",
      "file": "specs/auth.spec.md",
      "version": "1.0.0",
      "layer": 3,
      "tags": ["auth", "security"],
      "short": "Authentication system",
      "depends_on": ["@specs/users", "@specs/crypto"],
      "blocks": ["entities", "operations", "flows"]
    }
  },
  "graph": {
    "dependencies": {
      "@specs/auth": ["@specs/users", "@specs/crypto"]
    },
    "dependents": {
      "@specs/users": ["@specs/auth", "@specs/profile"]
    }
  },
  "orphans": ["@specs/legacy"],
  "cycles": []
}
```

## Test Cases
1. Index all specs correctly
2. Detect missing reference targets
3. Detect circular dependencies
4. Handle .spec.dir/ subfolders
5. Handle multiple spec formats (.spec.md, .scl, .spec.yaml)
6. Update index incrementally (only changed files)

## Validation
```bash
bun run scripts/generate_index.py
bun test tests/indexer.test.ts
```

## Output Format
After completing, output:
1. Number of specs indexed
2. Number of references found
3. Any cycles or orphans detected
4. Index generation time
