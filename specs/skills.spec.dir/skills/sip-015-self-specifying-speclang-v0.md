---
name: sip-015-self-specifying-speclang-v0
title: "SIP 15: Self-Specifying Specs"
version: 0.1.0
description: Meta-circular bootstrap process and self-hosting validation
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 15: Self-Specifying Specs

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP explains how SpecLang is self-specifying.

### Quick Start

1. **Meta-Circular:** specs/ define the system that reads specs/
2. **Bootstrap Order:** Phase 0 → Phase 5, sequential with validation
3. **AI as Compiler:** AI reads specs and generates code
4. **Self-Hosting Test:** SpecLang must build itself

### Key Concepts

- **Chicken-Egg Problem:** specs/ define how to build spec reader
- **Bootstrap Phases:** Ordered generation with validation gates
- **Tier System:** Human-written → generated → self-generated specs
- **Convergence:** Bootstrap complete when system builds itself

### When to Read This

- **Understanding architecture:** How SpecLang bootstraps
- **Contributing:** What specs are required
- **Self-hosting:** Validating the system works

### Related SIPs

- SIP 0: What is Speclang
- SIP 6: Agent Protocol
- SIP 7: Cascade System

## Abstract

This SIP defines the meta-circular bootstrap process for SpecLang. SpecLang is self-specifying: the specs/ directory defines how to build the system that reads specs/. This document explains the bootstrap phases, required starting specs, and self-hosting validation.

## Motivation

A self-specifying system needs:
- Clear bootstrap order
- Validation at each phase
- Self-hosting verification
- Recovery from failures

## Rationale

**Meta-Circular Design:**
- Specs are the source of truth
- System can evolve itself
- Documentation is executable
- Reduces conceptual overhead

**Phased Bootstrap:**
- Dependencies respected
- Validation at each step
- Clear progress tracking
- Easy rollback

**AI as Compiler:**
- AI reads specs like a compiler reads source
- Generates code from specifications
- Can reason about ambiguity
- Self-improving

## Specification

### The Chicken-Egg Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  SpecLang is self-specifying:                                   │
│                                                                 │
│  specs/ define how to build the system that reads specs/        │
│                                                                 │
│  Bootstrap order:                                               │
│  1. Human writes minimal specs (this file, NORTH_STAR)          │
│  2. AI acts as compiler, reading specs and generating code      │
│  3. Generated code becomes the SpecLang that reads specs        │
│  4. System can then spec itself autonomously                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Bootstrap Phases

```yaml
BootstrapPhases:
  
  phase_0_foundation:
    description: "Core infrastructure"
    specs:
      - specs/sqlite.spec.md
      - specs/headers.spec.md
      - specs/project-layout.spec.md
    generates:
      - src/db/
      - src/parser/
      - src/indexer/
    validation:
      - "bun run tsc --noEmit"
      - "bun test tests/db.test.ts"
      - "_index.json exists and valid"
    can_proceed_if: "All tests pass"
    
  phase_1_core_runtime:
    description: "Reactive core: daemon and agents"
    depends_on: [phase_0_foundation]
    specs:
      - specs/daemon.spec.md
      - specs/agent-protocol.spec.md
      - specs/cascade.spec.md
    generates:
      - src/daemon/
      - src/agents/
      - src/cascade/
    validation:
      - "cargo build --release"
      - "bun test tests/agents.test.ts"
    can_proceed_if: "Daemon compiles, agents work"
    
  phase_2_mcp_interface:
    description: "Universal editor interface"
    depends_on: [phase_1_core_runtime]
    specs:
      - specs/mcp.spec.md
    generates:
      - src/mcp/
    validation:
      - "bun test tests/mcp.test.ts"
      - "MCP server responds to ping"
    can_proceed_if: "MCP server works"
    
  phase_3_code_generation:
    description: "Spec-to-code compiler"
    depends_on: [phase_2_mcp_interface]
    specs:
      - specs/compiler.spec.md
      - specs/stdlib.spec.md
    generates:
      - src/codegen/
    validation:
      - "Generate sample spec, verify output"
    can_proceed_if: "Can generate working code"
    
  phase_4_pipeline:
    description: "Build automation and self-healing"
    depends_on: [phase_3_code_generation]
    specs:
      - specs/pipeline.spec.md
      - specs/recovery.spec.md
    generates:
      - src/pipeline/
      - src/recovery/
      - src/guard/
    validation:
      - "Run full pipeline on specs/"
      - "Verify convergence detection"
    can_proceed_if: "Full cascade converges"
    
  phase_5_meta_circular:
    description: "Self-hosting validation"
    depends_on: [phase_4_pipeline]
    validation:
      - "speclang build on this repo"
      - "Generated code compiles"
      - "All tests pass"
    can_proceed_if: "SpecLang builds itself"
```

### Required Starting Specs

```yaml
MinimalSpecs:
  
  tier_0_human_written:
    - docs/NORTH_STAR.md        # Vision
    - specs/project.scl         # North star spec
    - specs/core.spec.md        # Core concepts
    - specs/bootstrap.spec.md   # This spec
    - specs/headers.spec.md     # Header format
    - specs/cascade.spec.md     # Cascade mechanics
    
  tier_1_first_generated:
    - specs/sqlite.spec.md
    - specs/daemon.spec.md
    - specs/agent-protocol.spec.md
    - specs/mcp.spec.md
    - specs/compiler.spec.md
    - specs/pipeline.spec.md
    
  tier_2_self_generated:
    - All other specs generated by the system itself
```

### First-Run Sequence

```bash
# Step 1: Verify minimal specs exist
for spec in specs/project.scl specs/core.spec.md specs/headers.spec.md; do
  [ -f "$spec" ] || { echo "MISSING: $spec"; exit 1; }
done

# Step 2: Generate database layer
# AI reads sqlite.spec.md, generates src/db/
# Validate: bun test tests/db.test.ts

# Step 3: Generate parser layer  
# AI reads headers.spec.md, generates src/parser/
# Validate: bun test tests/parser.test.ts

# Step 4: Generate indexer
# AI reads project-layout.spec.md, generates src/indexer/
# Validate: _index.json exists

# Step 5: Continue through phases...
```

## Self-Hosting Test

### Validation Steps

```yaml
SelfHostingTest:
  description: "Verify SpecLang can build itself"
  
  steps:
    1:
      action: "Clean generated code"
      command: "rm -rf src/ generated/"
      
    2:
      action: "Run bootstrap"
      command: "speclang bootstrap --from specs/"
      
    3:
      action: "Verify compilation"
      command: "bun run tsc --noEmit"
      expect: "No errors"
      
    4:
      action: "Verify tests"
      command: "bun test"
      expect: "All tests pass"
      
    5:
      action: "Verify daemon"
      command: "cargo build src/daemon/"
      expect: "Binary compiles"
      
    6:
      action: "Verify MCP server"
      command: "bun run src/mcp/server.ts &"
      expect: "Server starts, responds to ping"
      
    7:
      action: "Full cascade test"
      command: "echo '# test' >> specs/test.spec.md"
      expect: "Cascade triggers, converges"

  success_criteria:
    - All generated code compiles
    - All tests pass
    - Daemon runs
    - MCP server responds
    - Cascade works
```

### Convergence Criteria

```yaml
BootstrapComplete:
  
  required_files:
    generated_code:
      - src/db/index.ts
      - src/parser/header.ts
      - src/indexer/index.ts
      - src/daemon/target/release/speclangd
      - src/agents/session.ts
      - src/mcp/server.ts
      - src/codegen/index.ts
      - src/pipeline/executor.ts
      - src/guard/registry.ts
      
  required_capabilities:
    - "Parse any spec file"
    - "Index all specs with references"
    - "Generate code from specs"
    - "Run pipeline after convergence"
    - "Recover from failures"
    - "Enforce file ownership"
```

## Agent Roles During Bootstrap

```yaml
BootstrapAgents:
  
  north_star:
    owns: [specs/project.scl, docs/NORTH_STAR.md]
    does: "Coordinates overall bootstrap, triggers first cascade"
    
  spec_writer:
    owns: [specs/**/*.spec.md, specs/**/*.scl]
    does: "Expands abstract specs into detailed specs"
    triggered_by: [north_star]
    
  code_gen:
    owns: [src/**/*.ts, src/**/*.rs]
    does: "Generates code from specs"
    triggered_by: [spec_writer]
    
  test_writer:
    owns: [tests/**/*.test.ts]
    does: "Generates tests from specs"
    triggered_by: [code_gen]
    
  adversary:
    owns: []  # Read-only
    does: "Validates work, provides steering feedback"
    triggered_by: [code_gen, test_writer]
```

## Rollback and Recovery

```yaml
BootstrapRollback:
  
  on_phase_failure:
    1: "Log failure details to .speclang/bootstrap-failures.log"
    2: "Identify which spec caused failure"
    3: "Rollback generated files to last good state"
    4: "Notify north_star agent with error details"
    5: "Wait for spec fix or human intervention"
    
  recovery_commands:
    rollback_last_phase: "speclang bootstrap --rollback"
    retry_current_phase: "speclang bootstrap --retry"
    restart_from_scratch: "rm -rf src/ && speclang bootstrap"
    
  failure_modes:
    spec_ambiguous:
      detection: "Multiple interpretations"
      fix: "Add more detail to spec"
      
    circular_dependency:
      detection: "A depends on B, B depends on A"
      fix: "Restructure specs"
      
    code_generation_error:
      detection: "Generated code doesn't compile"
      fix: "Fix spec, regenerate"
```

## References

- @ref:speclang/bootstrap
- @ref:speclang/cascade
- SIP 0: What is Speclang
- SIP 7: Cascade System

## Copyright

This document is in the public domain.
