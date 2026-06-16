# Bootstrap Phase 0.8: Symlinks and Dual-View

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.8 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1 (SQLite Database) complete
- Phase 0.2 (Header Parser) complete
- Phase 0.3 (Indexer) complete
- Phase 0.4 (Workflow) complete
- Phase 0.5 (Config) complete
- Phase 0.6 (Directory Structure) complete
- Phase 0.7 (Deployment) complete

## Your Task
Implement the dual-view architecture where specs/ is the source of truth and symlinks provide conventional project layout.

## Read These Specs First
1. `specs/symlinks.spec.md` - Full symlinks spec
2. `specs/directory-structure.spec.md` - Directory structure (for context)
3. `specs/project-layout.spec.md` - Project layout conventions

## What to Build

### Files to Create
```
src/symlinks/
├── index.ts            # Main symlinks module
├── creator.ts          # createSymlinks operation
├── verifier.ts         # verifySymlinks operation
├── rebuilder.ts        # rebuild operation
├── resolver.ts         # Get physical path from logical
└── cross-platform.ts   # Cross-platform symlink handling

tests/
└── symlinks.test.ts    # Symlink tests
```

### Requirements

#### 1. Dual-View Architecture
```typescript
interface DualView {
  physical: {
    location: "specs/ tree";
    structure: "hierarchical with .spec.dir/";
    contents: "all specs and generated code";
  };
  
  logical: {
    location: "src/, tests/, docs/, etc.";
    structure: "conventional project layout";
    contents: "symlinks to specs/";
  };
  
  mapping: {
    header_field: "target or output_path";
    example: "target: src/auth/login.go";
  };
}
```

#### 2. Physical vs Logical Layout
```
Physical (source of truth):
specs/
├── core/
│   └── auth/
│       ├── login.go.spec.yaml    # spec file
│       ├── login.go              # generated code
│       └── login_test.go         # generated test

Logical (symlinks):
src/
└── auth/
    └── login.go → ../../specs/core/auth/login.go

tests/
└── auth/
    └── login_test.go → ../../specs/core/auth/login_test.go
```

#### 3. Header Mapping
```yaml
# specs/core/auth/login.go.spec.yaml
--- speclang-header lines:12
id: @specs/auth/login
target: src/auth/login.go
language: go
---

# After generation:
# 1. specs/core/auth/login.go (real file)
# 2. src/auth/login.go (symlink to above)
```

#### 4. Symlink Creation
```typescript
function createSymlinks(): {
  created: string[];
  skipped: string[];
  errors: Error[];
} {
  // For each spec with target header:
  // 1. Generate code in specs/ location
  // 2. Read target path from header
  // 3. Ensure target directory exists
  // 4. Create symlink: target → specs/ location
  // 5. Log symlink creation
  
  // Rules:
  // - Overwrite existing symlinks
  // - Don't overwrite real files (error)
  // - Create parent directories
}
```

#### 5. Rebuild Operation
```typescript
function rebuild(options?: { clean?: boolean }): {
  generated: string[];
  symlinked: string[];
  errors: Error[];
} {
  // Scenario: rm -rf src/ tests/ generated/
  
  // Steps:
  // 1. Scan specs/ for all files
  // 2. Parse headers, find targets
  // 3. Regenerate code if needed
  // 4. Create all symlinks
  // 5. Verify symlinks valid
  // 6. Done
  
  // Command: speclang rebuild
  // Result: full project restored from specs/
}
```

#### 6. Symlink Verification
```typescript
function verifySymlinks(): {
  valid: string[];
  broken: string[];
  missing: string[];
} {
  // For each symlink:
  // 1. Check target exists
  // 2. Check points to specs/
  // 3. Check not broken
  
  // On broken:
  // - Re-create symlink
  // - Log warning
  
  // Command: speclang verify-symlinks
}
```

#### 7. Portability
```typescript
interface Portability {
  what_you_need: "just specs/ folder";
  
  what_you_get: [
    "All source code (via rebuild)",
    "All tests (via rebuild)",
    "All documentation (via rebuild)",
    "Complete project structure"
  ];
  
  workflow: [
    "Copy specs/ to new machine",
    "speclang rebuild",
    "Full project ready"
  ];
  
  benefit: "specs/ is complete, self-contained, portable";
}
```

#### 8. Cross-Platform Support
```typescript
interface CrossPlatformSymlinks {
  unix: {
    type: "symbolic links";
    command: "ln -s source target";
  };
  
  windows: {
    type: "junction points or symlinks";
    command: "mklink /J target source";
    requires: "Developer mode or admin";
  };
  
  fallback: {
    if_symlinks_unavailable: [
      "Copy files instead",
      "Track in .speclang/copies.json",
      "Sync on rebuild"
    ];
  };
}
```

#### 9. Git Handling
```typescript
interface GitSymlinks {
  tracked: [
    "specs/ (all real files)",
    "symlink files (the links themselves)"
  ];
  
  gitignore: [
    "Nothing special needed",
    "Symlinks are small text files in git"
  ];
  
  clone: [
    "Symlinks preserved on clone",
    "Works on all platforms (with git config)"
  ];
  
  git_config: "core.symlinks = true";
}
```

#### 10. MCP Tools
```typescript
const SymlinkTools = {
  speclang_create_symlinks: {
    description: "Create all symlinks from specs",
    params: {},
    returns: { created: [], skipped: [], errors: [] }
  },
  
  speclang_verify_symlinks: {
    description: "Check all symlinks valid",
    params: {},
    returns: { valid: [], broken: [], missing: [] }
  },
  
  speclang_rebuild: {
    description: "Rebuild entire project from specs",
    params: { clean?: boolean },
    returns: { generated: [], symlinked: [], errors: [] }
  },
  
  speclang_get_physical_path: {
    description: "Get real path from symlink",
    params: { logical_path: string },
    returns: { physical_path: string }
  }
};
```

#### 11. Complete Layout Example
```
project/
├── specs/                          # SOURCE OF TRUTH
│   ├── project.scl                 # north star
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.spec.yaml
│   │   │   ├── login.go.spec.yaml
│   │   │   ├── login.go            # real generated
│   │   │   └── login_test.go       # real generated
│   │   └── users/
│   │       └── ...
│   └── expanded/
│       └── ...
│
├── src/                            # SYMLINKS
│   └── auth/
│       └── login.go → ../../specs/core/auth/login.go
│
├── tests/                          # SYMLINKS
│   └── auth/
│       └── login_test.go → ../../specs/core/auth/login_test.go
│
├── .speclang/
│   └── speclang.db
│
└── build.yaml
```

### Code Quality
- Handle Windows junction points
- Graceful fallback when symlinks unavailable
- All operations typed with JSDoc
- Reference spec blocks in comments

## Validation
```bash
bun test tests/symlinks.test.ts
speclang create-symlinks
speclang verify-symlinks
speclang rebuild --dry-run
```

## Output Format
After completing, output:
1. List of files created
2. Test results
3. Any deviations from the spec (with justification)
