# speclang-header lines:9
id: "@speclang/assembler/skill-specs"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [assembler, skills, agents, roles]
status: draft
short: "Skill definitions for each SpecLang agent role"
---

# Agent Role Skill Definitions

Each agent role has a skill definition loaded into its Pi session. Skills define the agent's behavior, tools, and constraints.

## Agent Roles

| Role | Owns | Skill |
|------|------|-------|
| NorthStar | `project.scl`, seed specs | High-level intent, vision, product direction |
| SpecWriter | `specs/**/*.spec.md` | Expands high-level specs into detailed specs |
| CodeGen | `**/*.spec.{lang}.md` → `*.spec.{lang}` | Assembles source code from code-pair specs |
| TestWriter | `**/*.test.spec.md` | Writes test specs and test code |
| BackSync | Any generated file | Syncs code changes back to specs (bidirectional) |
| Assembler | `.spec.{lang}.md` → `.spec.{lang}` | Extracts code blocks, assembles output files |
| Pipeline | build.yaml | Executes build/test/deploy on convergence |

## Skill: SpecWriter

Responsible for expanding higher-level specs into detailed sub-specs. Loaded as a Pi session.

```
Name: SpecWriter
Purpose: Expand high-level specs into detailed sub-specs
Model pool: spec-writer
Tools: create_spec_file, read_spec, search_specs, validate_specs
Behavior:
  - Reads parent spec (from cascade context)
  - Analyzes what sub-specs are needed (entities, operations, types)
  - Creates sub-spec files with valid headers
  - Ensures @ref: links to parent and siblings
  - Validates output with validate_specs
```

## Skill: CodeGen

Assembles source code from code-pair specs.

```
Name: CodeGen
Purpose: Read .spec.{lang}.md files and assemble .spec.{lang} source code
Model pool: code-gen
Tools: read_spec, read_refs, write_file, run_shell, validate_output
Behavior:
  - Reads the code-pair spec file
  - Reads all referenced specs (@ref: links)
  - Understands the folder structure for context
  - Assembles source code in the target language
  - Outputs to the path specified by the header's `output` field
  - Runs target language build to verify (if available)
```

## Skill: Assembler

The core assembler engine — extracts code from `## Implementation` blocks in `.spec.{lang}.md` files and writes `.spec.{lang}` files.

```
Name: Assembler
Purpose: Extract code blocks from spec files and assemble output
Model pool: code-gen
Tools: read_spec, extract_blocks, write_file
Behavior:
  - Reads the spec file
  - Finds ## Implementation sections
  - Extracts TypeScript/Python/Go code from code fences
  - Writes to the output path from the header's `output` field
  - Used during bootstrap and self-hosting
```

## Skill: Pipeline

Executes build/test/deploy pipeline on convergence.

```
Name: Pipeline
Purpose: Run build.yaml stages on cascade convergence
Model pool: code-gen
Tools: run_shell, read_file, git_commit
Behavior:
  - Reads build.yaml
  - Resolves stage dependencies
  - Executes stages in order
  - Runs target language compiler
  - Runs tests
  - On success: git commit with cascade_id
  - On failure: rollback, retry (3x), notify
```

## Skill: NorthStar

Maintains the high-level project intent. Rarely invoked — only on seed spec changes.

```
Name: NorthStar
Purpose: Maintain project vision and high-level direction
Model pool: spec-writer
Tools: read_spec, project_status
Behavior:
  - Reads project.scl
  - Validates alignment with all generated specs
  - Reports drift between intent and implementation
```

## See Also

- @ref:specs/core.spec.dir/agents
- @ref:specs/agent-protocol
- @ref:specs/pi-integration
