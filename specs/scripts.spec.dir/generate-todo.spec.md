# speclang-header lines:12
id: "@speclang/scripts-generate-todo"
version: 0.1.0
layer: 2
tags: [scripts, generation, todo]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Generate Todo Script
target: scripts/generate_todo.py
---

# Generate Todo Script

Generates TODO.md from spec task definitions. Automatically extracts tasks, phases, and status from specs to create a prioritized TODO list.

## Overview

```speclang
# @block:overview @kind:note
The generate-todo script analyzes SpecLang specs to extract task definitions
and generates a formatted TODO.md file. Tasks are extracted from @kind:task
blocks, status annotations, and phase definitions in specs.
```

## Purpose

```speclang
# @block:purpose @kind:note
Keeping TODO.md in sync with specs is error-prone. This script:
1. Extracts tasks from spec files automatically
2. Determines task status from implementation
3. Generates prioritized task list
4. Updates TODO.md in standard format
```

## Task Sources

```speclang
# @block:sources @kind:entity
TaskSources:
  spec_headers:
    - status field (draft, active, complete)
    - todo field with task list
    - depends_on for ordering
  
  spec_blocks:
    - @kind:task blocks
    - @kind:todo blocks
    - @block:* with @status:complete
  
  external:
    - GitHub issues (if connected)
    - Steering packets
    - Verifier output
```

## Implementation

```speclang
# @block:implementation @kind:function
def generate_todo(spec_dir: str, output_path: str, options: dict) -> dict:
    """
    Generate TODO.md from spec task definitions.
    
    Args:
        spec_dir: Directory containing specs
        output_path: Path for generated TODO.md
        options: Filter and sort options
    
    Returns:
        Dict with tasks_extracted, phases, status
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Scan spec directory recursively
2. Parse spec headers for task definitions
3. Extract @kind:task blocks from spec content
4. Determine task status:
   - draft → not started
   - active → in progress
   - complete → done (if implementation exists)
   - deprecated → cancelled
5. Order tasks by:
   - Phase (as defined in spec)
   - Dependency order (depends_on)
   - Priority annotations
6. Generate TODO.md with sections
```

## Task Status

```speclang
# @block:status @kind:table
| Spec Status | Task Status | Description |
|-------------|-------------|-------------|
| draft | [ ] Not Started | Task not yet started |
| active | [x] In Progress | Currently being worked on |
| complete | [x] Done | Task completed |
| deprecated | [-] Cancelled | Task no longer needed |
```

## Output Format

```speclang
# @block:format @kind:note
# TODO.md Format

## Phase 1: Foundation (5 tasks)
- [x] Task 1 - Complete
- [ ] Task 2 - Not Started
- [x] Task 3 - Done

## Phase 2: Features (10 tasks)
- [x] Task 4 - Complete
- [ ] Task 5 - In Progress

## Summary
Total: 15 | Done: 3 | In Progress: 1 | Remaining: 11
```

## Usage

```speclang
# @block:usage @kind:note
# Generate TODO.md from all specs
python3 scripts/generate_todo.py specs/

# Specify output path
python3 scripts/generate_todo.py specs/ --output TODO.md

# Include only tasks with specific tags
python3 scripts/generate_todo.py specs/ --tags critical

# Show only incomplete tasks
python3 scripts/generate_todo.py specs/ --status pending

# Update in place
python3 scripts/generate_todo.py specs/ --update

# Dry run
python3 scripts/generate_todo.py specs/ --dry-run
```

## Task Prioritization

```speclang
# @block:priority @kind:entity
PriorityRules:
  p0_critical:
    - Blocking issues
    - Security vulnerabilities
    - Build failures
  
  p1_high:
    - Core features
    - Required functionality
  
  p2_medium:
    - Enhancements
    - Nice-to-have features
  
  p3_low:
    - Documentation
    - Polish tasks
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/headers - Header format with task fields
- @ref:speclang/scripts.generate-mcp-server - Related generator
- @ref:speclang/ralph-loop - Ralph Loop integration
```
