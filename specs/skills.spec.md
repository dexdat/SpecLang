# speclang-header lines:12
id: "@speclang/skills"
version: 0.1.0
layer: 0
tags: [skills, agents, prompts, ai]
imports: ["@speclang/core"]
status: draft

project_level: Alpha
agent_support: agent_assisted
short: Speclang Skills Pack
---

# Speclang Skills Pack

AI editor skills that drive the reactive system.

## Overview

```speclang
# @block:skills/overview @kind:entity
SkillsPack:
  description: "Collection of skills for AI editors"
  targets: Claude Code, Cursor, Windsurf, OpenCode
  
  structure:
    speclang-skills/
      SpecWriter/
      CodeGen/
      TestWriter/
      BackSync/
      Orchestrator/
  
  install: copy to editor's skills directory
```

---

## Skill Structure

### @skills/format

```speclang
# @block:skills/format @kind:entity
Skill:
  SKILL.md: skill definition and prompts
  prompts/: reusable prompt templates
  tools/: tool definitions (optional)
  examples/: example usage (optional)

SKILL.md format:
  ---
  name: SpecWriter
  description: Writes and expands spec files
  triggers: file change events
  ---
  
  # System Prompt
  
  You are the SpecWriter agent...
  
  # Prompts
  
  ## On File Change
  
  When you receive a file change event...
```

---

## Core Skills

This spec has been split into sub‑specs for each core agent skill:

### @skills/specwriter-ref
- **SpecWriter**: @ref:specs/skills.dir/spec-writer
  - Writes and expands spec files
  - Owns: `specs/**/*.scl`
  - Triggers: north star changes, other spec changes

### @skills/codegen-ref
- **CodeGen**: @ref:specs/skills.dir/code-gen
  - Generates code from specs
  - Owns: `generated/**/*.{go,ts,py,rs,java}`
  - Triggers: spec file changes

### @skills/testwriter-ref
- **TestWriter**: @ref:specs/skills.dir/test-writer
  - Writes and runs tests from specs
  - Owns: `tests/**/*.test.spec.scl`, `tests/**/*_test.*`
  - Triggers: test spec changes, code changes

See the individual sub‑specs for detailed prompts and behavior.

---

## BackSync Skill

### @skills/backsync

```speclang
# @block:skills/backsync @kind:note
Skill: BackSync
Triggers: human edits to generated files
Produces: proposed spec updates
```

### @skills/backsync-prompt

```speclang
# @block:skills/backsync-prompt @kind:code
```markdown
---
name: BackSync
description: Syncs code changes back to specs
owns: none (monitors generated/)
---

# System Prompt

You are the BackSync agent for Speclang.

Your job is to detect when humans edit generated code
and propose spec updates to match.

## Detection

A human edit is detected when:
- File is modified but no agent holds the lock
- Change is not from a SPECLANG agent

## Process

1. Parse the code change
2. Find SPECLANG-ID markers
3. Determine what spec blocks are affected
4. Propose spec updates
5. Ask for approval before applying

## Approval Flow

You must always ask:
"The code in {file} was changed. This affects {spec}.
Proposed update:
{diff}

Apply this change to the spec? [Y/n]"

Only proceed on explicit approval.

## On File Change

1. Check if human edit (no lock, not from agent)
2. If yes, parse change
3. Find affected spec via SPECLANG-ID
4. Generate spec update proposal
5. Request approval
6. If approved, update spec file
```
```

---

## Orchestrator Skill

### @skills/orchestrator

```speclang
# @block:skills/orchestrator @kind:note
Skill: Orchestrator
Triggers: user commands, convergence
Produces: coordination of other agents
```

### @skills/orchestrator-prompt

```speclang
# @block:skills/orchestrator-prompt @kind:code
```markdown
---
name: Orchestrator
description: Coordinates all agents
owns: project.scl (north star)
---

# System Prompt

You are the Orchestrator agent for Speclang.

You own the north star file and coordinate all other agents.
You are the user's main conversation partner.

## Responsibilities

1. Maintain the north star file
2. Route user intent to appropriate agents
3. Monitor overall progress
4. Handle convergence

## User Interaction

When the user speaks:
1. Update north star with their intent
2. Identify what needs to happen
3. Let the cascade begin

Example:
User: "Add password reset"

You:
- Update north star: add @block:auth/password-reset
- SpecWriter will expand this
- CodeGen will implement it
- TestWriter will test it

## Convergence

When quiet period detected:
1. Confirm all agents idle
2. Run full test suite
3. Summarize changes
4. Commit
5. Report to user

## Commands

/finalize - force convergence check
/status - show all agent states
/expand <block> - expand specific block
/rollback - revert last cascade
```
```

---

## Installation

### @skills/install

```speclang
# @block:skills/install @kind:entity
InstallSteps:
  1. Download skills pack:
     git clone https://speclang.dev/skills ~/.speclang/skills
     
  2. Point editor to skills:
     Claude Code: ~/.claude/skills/
     Cursor: ~/.cursor/skills/
     Windsurf: ~/.windsurf/skills/
     
  3. Copy or symlink:
     ln -s ~/.speclang/skills/* ~/.claude/skills/
     
  4. Restart editor
```

---

## Custom Skills

### @skills/custom

```speclang
# @block:skills/custom @kind:entity
CustomSkill:
  location: .speclang/skills/{name}/
  override: local skills override built-in
  
  use_cases:
    - company-specific conventions
    - custom target languages
    - specialized codegen templates
    - additional validation rules
```