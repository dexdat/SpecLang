# speclang-header lines:12
id: "@speclang/scripts.generate-ralph-loop"
version: 0.1.0
layer: 2
tags: [scripts, generation, ralph-loop]
parent: "@ref:speclang/scripts"
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Generate Ralph Loop Script
target: scripts/generate_ralph_loop.py
---

# Generate Ralph Loop Script

Generates Ralph Loop implementation from specs. Creates a complete dual-agent coordination system with Builder and Verifier agents.

## Overview

```speclang
# @block:overview @kind:note
The generate-ralph-loop script creates a complete Ralph Loop implementation from
spec definitions. Ralph Loop is a dual-agent pattern where Builder Agent writes
implementation and Verifier Agent validates output, with steering packets guiding iterations.
```

## Purpose

```speclang
# @block:purpose @kind:note
The Ralph Loop enables autonomous iteration on specs. This script:
1. Generates agent implementations from spec definitions
2. Creates steering packet structures
3. Sets up validation and verification workflows
4. Configures the loop control mechanism
```

## Ralph Loop Components

```speclang
# @block:components @kind:entity
RalphLoopComponents:
  builder:
    description: Agent that implements features from specs
    inputs: steering packets, spec files
    outputs: implementation code, spec updates
  
  verifier:
    description: Agent that validates builder output
    inputs: implementation code, specs
    outputs: validation results, steering packets
  
  steering_packet:
    description: Direction for next iteration
    contains: failures, suggestions, priorities
  
  loop_control:
    description: Orchestrates the iteration cycle
    states: running, paused, converged, failed
```

## Implementation

```speclang
# @block:implementation @kind:function
def generate_ralph_loop(spec_path: str, output_dir: str, options: dict) -> dict:
    """
    Generate Ralph Loop implementation from spec.
    
    Args:
        spec_path: Path to Ralph Loop spec definition
        output_dir: Directory to write generated files
        options: Generation options
    
    Returns:
        Dict with files_generated, agents_configured, errors
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Parse Ralph Loop spec definition
2. Extract agent configurations (builder, verifier)
3. Generate agent skill files
4. Create steering packet types
5. Generate loop control script
6. Set up validation pipeline integration
7. Create state management (SQLite)
8. Write all files to output directory
```

## Agent Types

```speclang
# @block:agents @kind:table
| Agent | Role | Input | Output |
|-------|------|-------|--------|
| Builder | Implements specs | Steering packet | Code, specs |
| Verifier | Validates output | Code, specs | Validation result |
| Coordinator | Orchestrates loop | Loop state | Next action |
| Adversary | Finds flaws | Any spec/code | Critique |
```

## Steering Packets

```speclang
# @block:steering @kind:entity
SteeringPacket:
  fields:
    - failures: List of validation failures
    - suggestions: Improvement recommendations
    - priorities: Ordered task list
    - context: Current state summary
    - iteration: Loop iteration number
  
  usage:
    - Guide builder to next task
    - Track progress toward goal
    - Enable resume after interruption
```

## Loop States

```speclang
# @block:states @kind:entity
LoopStates:
  running:
    description: Active iteration in progress
  
  paused:
    description: Waiting for human input
  
  converged:
    description: All validations passed
  
  failed:
    description: Max iterations reached without success
```

## Usage

```speclang
# @block:usage @kind:note
# Generate Ralph Loop from spec
python3 scripts/generate_ralph_loop.py specs/ralph-loop.spec.md

# Specify output directory
python3 scripts/generate_ralph_loop.py specs/ralph-loop.spec.md --output .ralph/

# Generate with custom agent names
python3 scripts/generate_ralph_loop.py specs/ralph-loop.spec.md --builder my-builder --verifier my-verifier

# Dry run
python3 scripts/generate_ralph_loop.py specs/ralph-loop.spec.md --dry-run
```

## Output Files

```speclang
# @block:output @kind:entity
GeneratedFiles:
  scripts:
    - ralph_loop.py
    - builder_agent.py
    - verifier_agent.py
    - steering.py
  
  config:
    - .ralph/config.yaml
    - .ralph/prd.json
  
  skills:
    - .opencode/skills/builder.md
    - .opencode/skills/verifier.md
  
  db:
    - .ralph/schema.sql
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/ralph-loop - Ralph Loop system specification
- @ref:speclang/ralph-loop.spec.dir/state - State definitions
- @ref:speclang/ralph-loop.spec.dir/workflow - Workflow processes
- @ref:speclang/agents - Agent definitions
```
