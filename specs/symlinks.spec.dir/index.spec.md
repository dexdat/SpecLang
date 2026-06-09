# speclang-header lines:10
id: "@specs/symlinks"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_autonomous
target: src/symlinks/
tags: [symlinks, dual-view, infrastructure]
short: Dual-view system for spec-to-implementation mapping
---

# Symlinks Module Specification

This module implements the dual-view pattern where specs/ is the source of truth and working directories (src/, tests/, etc.) contain symlinks pointing to spec files.

## Overview

The symlinks module provides:
- **Creation**: Create symlinks from specs to working locations
- **Verification**: Check if symlinks are valid and working
- **Rebuilding**: Regenerate symlinks after spec changes

## Architecture

### @block::symlinks/overview @kind:concept

```
specs/                          src/
├── auth.spec.dir/              ├── auth/
│   └── src/login.ts    →  ←──  └── login.ts
├── db.spec.dir/                ├── db/
│   └── index.ts       →  ←──  └── index.ts
```

### @block::symlinks/types @kind:types

Types for dual-view system:

```typescript
interface DualView {
  physical: PhysicalView;
  logical: LogicalView;
  mapping: HeaderMapping;
}

interface SymlinkEntry {
  logicalPath: string;
  physicalPath: string;
  isValid: boolean;
}
```

### @block::symlinks/creation @kind:module

**Location:** `src/symlinks/creator.ts`

Creates symlinks from specs to working locations based on `target` header field.

### @block::symlinks/verification @kind:module

**Location:** `src/symlinks/verifier.ts`

Verifies symlinks are valid, detects broken links.

### @block::symlinks/rebuilding @kind:module

**Location:** `src/symlinks/rebuilder.ts`

Regenerates all symlinks, optionally cleaning first.

## API

### @block::symlinks/api @kind:api

```typescript
// Main exports from index.ts
export * from './types.js';
export * from './creator.js';
export * from './verifier.js';
export * from './rebuilder.js';
```

## Cross-Platform

### @block::symlinks/platform @kind:concept

- **Unix**: Uses `ln -s` (symbolic links)
- **Windows**: Uses `mklink /J` (junction) or symbolic links
- **Fallback**: Copy files if symlinks unavailable
