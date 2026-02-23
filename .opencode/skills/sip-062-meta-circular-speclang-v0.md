---
name: sip-062-meta-circular-speclang-v0
title: "SIP 62: Meta-Circular Development"
version: 0.1.0
description: Self-hosting and bootstrap process for Speclang
category: standard
---

# SIP 62: Meta-Circular Development

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the meta-circular development approach for building Speclang using Speclang itself.

### Quick Start

1. **Write Specs:** Define how to build Speclang
2. **Create Agent:** Understands Speclang workflow
3. **Manual Emulation:** Use agent to emulate Speclang
4. **Ralph Loop:** Complete expansion
5. **Dogfooding:** Use built version to improve itself

### Example

```speclang
# This spec describes itself
# @block:meta/self-reference @kind:note
This spec describes itself.

- It is written in Speclang format
- It follows header conventions
- It uses @ref: pointers
- It will be used to build Speclang
- Speclang will then read this spec
```

### Key Concepts

- **Meta-Circular:** Building tool using itself
- **Ralph Loop:** Iterative completion pattern
- **Dogfooding:** Using own tool
- **Self-Improvement:** Each version builds next

### When to Read This

- **Bootstrapping:** Understanding initial build
- **Self-Hosting:** Building Speclang with Speclang
- **Evolution:** Improving tool over time

### Related SIPs

- SIP 44: Bootstrap
- SIP 45: Ralph Loop
- SIP 15: Self-Specifying

## Abstract

This SIP defines the meta-circular development approach where Speclang is built using Speclang itself, creating a self-improving system.

## Motivation

Building Speclang needs:
- Self-consistency
- Evolution capability
- Proof of concept
- Sustainable development

## Rationale

**Meta Loop:**

```
flowchart TD
    S[Write Specs] --> A[Create Agent]
    A --> M[Manual Emulation]
    M --> R[Ralph Loop]
    R --> B[Build Code]
    B --> T[Test]
    T --> U[Use Speclang]
    U --> I[Improve]
    I --> S
```

**Benefits:**
- Self-improving system
- Consistency verification
- Natural evolution
- Dogfooding validation

## Specification

### Overview

**@meta/overview:**

```speclang
Speclang is built using Speclang. This spec describes the meta-circular development approach:

1. Write specs describing how to build Speclang
2. Create an agent that understands Speclang workflow
3. Manually emulate Speclang with that agent
4. Use Ralph Loop to complete expansion
5. Build actual Speclang code
6. Test in OpenCode
7. Use built Speclang to build new projects
8. Use each version to improve the next

This creates a self-improving system.
```

### Phase 1: Foundation

**@meta/phase1:**

```speclang
Phase1:
  tasks:
    - Finalize SIPs & Skills (existing in opencode/skills/)
    - Write implementation specs (this directory)
    - Define agent that understands Speclang workflow
    - Create _index.json mapping file
  
  output:
    - Complete spec set
    - Agent skill for meta development
    - Index for model access
```

### Phase 2: Hybrid Bootstrap

**@meta/phase2:**

```speclang
Phase2:
  tasks:
    - Build core templates manually
    - Create OpenCode plugin skeleton
    - Create TypeScript MCP server skeleton
    - Implement basic SQLite schema
  
  approach:
    - Manual coding for minimal core
    - Enough to start Ralph Loop
    - Templates for speclang init
```

### Phase 3: Ralph Loop

**@meta/phase3:**

```speclang
Phase3:
  description: "Use Ralph Loop pattern to complete system"
  
  ralph_loop_pattern:
    - Allocate array with required backing specifications
    - Give it a goal
    - Loop the goal
    - Watch loop for failure domains
    - Engineer solutions for failures
  
  application:
    - Goal: Complete Speclang implementation
    - Loop: Expand all implementation specs
    - Watch: Identify missing components
    - Fix: Add specs/components as needed
```

### Phase 4: Dogfooding

**@meta/phase4:**

```speclang
Phase4:
  description: "Use built Speclang to improve itself"
  
  workflow:
    1. Build Speclang v0.1 from specs
    2. Test v0.1 in OpenCode
    3. Use v0.1 to build v0.2 specs
    4. Generate v0.2 code
    5. Test v0.2
    6. Repeat
    
  key_insight:
    - Each version can build the next
    - Continuous self-improvement
    - Evolutionary software development
```

### Agent Creation

**@meta/agent:**

```speclang
MetaAgent:
  name: speclang-builder
  purpose: "Understand Speclang workflow and emulate it manually"
  
  capabilities:
    - Read all SIPs and skills
    - Understand spec format
    - Emulate cascade behavior
    - Write implementation specs
    - Coordinate with human
  
  workflow:
    1. Human talks to agent
    2. Agent reads existing specs
    3. Agent suggests next steps
    4. Human approves/guides
    5. Agent writes specs
    6. Repeat until Ralph Loop ready
```

### Index File

**@meta/index:**

```speclang
IndexFile:
  path: _index.json
  format: JSONL (one JSON object per line)
  spec: @ref:sip-034-index-format
  content: aggregated headers from all files
  
  purpose:
    - Models can read without database
    - Quick overview of all specs
    - Track file relationships
    - Support search without SQLite
  
  generation:
    - On each file change
    - Parse header only
    - Add to index
    - Maintain sorted order
    - Follows SIP 34 specification
```

### Self-Reference

**@meta/self-reference:**

```speclang
This spec describes itself.

- It is written in Speclang format
- It follows header conventions
- It uses @ref: pointers
- It will be used to build Speclang
- Speclang will then read this spec

Meta-circular completeness.
```

## Implementation

### Bootstrap Script

```bash
#!/bin/bash
# bootstrap.sh - Initial Speclang bootstrap

PHASE=${1:-1}

case $PHASE in
  1)
    echo "Phase 1: Foundation"
    python3 generate_index.py
    echo "Index generated"
    ;;
  2)
    echo "Phase 2: Hybrid Bootstrap"
    mkdir -p generated/
    # Manual template creation
    cp templates/* generated/
    ;;
  3)
    echo "Phase 3: Ralph Loop"
    # Start Ralph Loop expansion
    node scripts/ralph-loop.js
    ;;
  4)
    echo "Phase 4: Dogfooding"
    # Use built version
    ./bin/speclang generate
    ;;
  *)
    echo "Usage: $0 [1|2|3|4]"
    ;;
esac
```

### Version Evolution

```typescript
// version-evolution.ts
interface VersionInfo {
  version: string;
  builtBy: string;
  specs: string[];
  improvements: string[];
}

const evolution: VersionInfo[] = [
  {
    version: '0.1.0',
    builtBy: 'manual',
    specs: ['core', 'cli', 'mcp'],
    improvements: ['initial implementation'],
  },
  {
    version: '0.2.0',
    builtBy: '0.1.0',
    specs: ['core', 'cli', 'mcp', 'ui'],
    improvements: ['ui support', 'improved parsing'],
  },
  {
    version: '0.3.0',
    builtBy: '0.2.0',
    specs: ['core', 'cli', 'mcp', 'ui', 'cascade'],
    improvements: ['cascade system', 'better validation'],
  },
];

function getNextVersion(current: string): VersionInfo | undefined {
  const idx = evolution.findIndex(v => v.version === current);
  return evolution[idx + 1];
}
```

### Self-Check Script

```typescript
// self-check.ts
async function selfCheck(): Promise<boolean> {
  const checks = [
    checkHeaderFormat(),
    checkReferences(),
    checkBlockSyntax(),
    checkConsistency(),
  ];
  
  const results = await Promise.all(checks);
  return results.every(r => r);
}

async function checkHeaderFormat(): Promise<boolean> {
  const specs = await loadAllSpecs();
  return specs.every(spec => {
    const header = parseHeader(spec);
    return header.id && header.version && header.layer !== undefined;
  });
}

async function checkReferences(): Promise<boolean> {
  const specs = await loadAllSpecs();
  const ids = new Set(specs.map(s => s.id));
  
  return specs.every(spec => {
    const refs = extractReferences(spec);
    return refs.every(ref => ids.has(ref.target));
  });
}

async function checkConsistency(): Promise<boolean> {
  const index = await loadIndex();
  const specs = await loadAllSpecs();
  
  return specs.every(spec => {
    const indexEntry = index.find(e => e.id === spec.id);
    return indexEntry?.version === spec.version;
  });
}
```

### Evolution Metrics

```typescript
// metrics.ts
interface EvolutionMetrics {
  version: string;
  specCount: number;
  blockCount: number;
  refCount: number;
  coverage: number;
}

async function trackEvolution(): Promise<EvolutionMetrics[]> {
  const history: EvolutionMetrics[] = [];
  
  for (const version of getVersionTags()) {
    await checkoutVersion(version);
    history.push({
      version,
      specCount: await countSpecs(),
      blockCount: await countBlocks(),
      refCount: await countReferences(),
      coverage: await measureCoverage(),
    });
  }
  
  return history;
}
```

## Next Steps

1. Create _index.json per SIP 34 (done)
2. Write agent skill for speclang-builder (done)
3. Begin manual emulation
4. Implement Ralph Loop
5. Build core templates
6. Start dogfooding loop

## References

- @ref:specs/implementation.spec.spec.dir/meta-circular
- SIP 44: Bootstrap
- SIP 45: Ralph Loop
- SIP 15: Self-Specifying
- SIP 34: Index Format

## Copyright

This document is in the public domain.
