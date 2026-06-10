---
id: "@speclang/agent-protocol"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [agents, protocol, ownership, sessions, guard, model-resolution, rate-limit]
children:
  - "@ref:specs/agent-protocol.spec.dir/types"
  - "@ref:specs/agent-protocol.spec.dir/sessions"
  - "@ref:specs/agent-protocol.spec.dir/ownership"
  - "@ref:specs/agent-protocol.spec.dir/rules"
  - "@ref:specs/agent-protocol.spec.dir/registry"
  - "@ref:specs/agent-protocol.spec.dir/interceptor"
  - "@ref:specs/agent-protocol.spec.dir/violations"
short: "Agent Protocol - Ownership, sessions, write guards, model resolution"
status: draft
---

# Agent Protocol

Protocol defining agent roles, file ownership, session management, write guards, model resolution, and rate limit enforcement to prevent conflicts in the reactive cascade.

## Overview

```speclang
# @block:agent-protocol/overview @kind:entity
AgentProtocol:
  principles:
    - one_agent_per_file: Each file has single owning agent
    - read_any_write_owned: Agents can read any file, write only owned files
    - session_persistence: Agent sessions survive interruptions
    - guard_enforcement: Write attempts are intercepted and validated

  agent_roles:
    - northstar: Owns project.scl, high-level direction
    - spec_writer: Expands high-level specs into detailed specs
    - code_gen: Generates target language code from specs
    - test_writer: Creates tests from natural language test specs
    - back_sync: Syncs code changes back to specs (bidirectional)
    - assembler: Reads .spec.{lang}.md files and produces .spec.{lang} files
    - pipeline: Executes build/test/deploy after convergence

  ownership_rules:
    - pattern_based: "specs/**/*.spec.md" → spec_writer
    - pattern_based: "specs/**/*.spec.{lang}.md" → assembler
    - pattern_based: "src/**/*.go" → code_gen
    - explicit: Header field `owned-by:` overrides pattern-based ownership
    - header_field_wins: Header `owned-by:` always takes precedence
    - inheritance: Sub-specs inherit parent's owner

  guard_system:
    - extension: Pi extension intercepts write attempts via pi.registerTool() + onToolCall
    - validation: Checks ownership before allowing write
    - logging: Records violations for debugging
    - override: User session can write anywhere
```

## Model Resolution

### @block:agent-protocol/model-resolution @kind:entity
```speclang
ModelResolution:
  description: "Three-layer model resolution for agent sessions (first match wins)"

  layers:
    1. header_model:
       source: "Header `model:` field"
       example: "openai/gpt-4o, openrouter/claude-3-opus"
       priority: "Highest — explicit override per spec"

    2. header_model_pool:
       source: "Header `model_pool:` field"
       example: "code-gen, spec-writer, fast-track"
       behavior: "Named pool of models with this capability"
       priority: "Medium — pool-based selection"

    3. file_pattern_default:
       source: "File pattern → owned-by role's default model"
       example: "specs/**/*.spec.{lang}.md" → owned-by role default
       priority: "Lowest — fallback when no header override"
```

## Rate Limit Enforcement

### @block:agent-protocol/rate-limit-enforcement @kind:entity
```speclang
RateLimitEnforcement:
  description: "Rate limiting for cascade triggers and agent sessions"

  header_fields:
    - max_concurrent: "Max concurrent agent sessions for this spec"
    - rate_limit: "Rate limit per minute for cascade triggers"

  enforcement:
    - spec_level: "max_concurrent and rate_limit from spec header"
    - pool_level: "Pool-level limits from model pool configuration"
    - cascade_router: "Enforces all limits before dispatching work"

  resolution:
    - Effective limit = min(spec.header.value, pool_config.value)
    - Both must pass for dispatch to proceed
```

## Ownership with owned-by Field

The `owned-by` header field is the explicit owner of a spec file. Pattern-based ownership (e.g., `specs/**/*.spec.md` → spec_writer) serves as the fallback. If both a pattern match and an `owned-by` header exist, the header field wins.

Owned-by values: `northstar`, `spec-writer`, `codegen`, `test-writer`, `back-sync`, `assembler`, `pipeline`

## Components

- **Types**: @ref:specs/agent-protocol.spec.dir/types - Data structures and type definitions
- **Sessions**: @ref:specs/agent-protocol.spec.dir/sessions - Agent session lifecycle and state
- **Ownership**: @ref:specs/agent-protocol.spec.dir/ownership - File ownership tracking and rules
- **Rules**: @ref:specs/agent-protocol.spec.dir/rules - Default and custom ownership rules
- **Registry**: @ref:specs/agent-protocol.spec.dir/registry - Agent registry and lookup
- **Interceptor**: @ref:specs/agent-protocol.spec.dir/interceptor - Write interception implementation
- **Violations**: @ref:specs/agent-protocol.spec.dir/violations - Violation tracking and reporting

## Integration with Pi Agent

The agent protocol is enforced via a Pi extension that intercepts file writes via pi.registerTool() + onToolCall event handlers:

1. Intercepts file write attempts
2. Checks if the agent owns the file (by pattern or header)
3. Allows writes from user-controlled sessions (whitelist)
4. Blocks unauthorized writes and logs violations
5. Provides tools for ownership query and management

This prevents agents from stepping on each other's files during concurrent cascade execution.

## File Creation Tool

Agents can create new files via a dedicated tool (available as a Pi extension):

### @block::agent-protocol/file-creation-tool @kind:tool
```speclang
# @block:agent-protocol/file-creation-tool @kind:tool
FileCreationTool:
  name: "create_spec_file"
  purpose: "Create new spec file with proper headers"

  parameters:
    file_path:
      type: string
      description: "Full path to new file (e.g., specs/auth/handler.go.spec)"
      required: true

    headers:
      type: object
      description: "YAML header content for new file"
      required: true
      properties:
        id: {type: string, pattern: "^@[a-zA-Z0-9/-]+$"}
        version: {type: string, pattern: "^\\d+\\.\\d+\\.\\d+$"}
        layer: {type: integer, minimum: 0, maximum: 100}
        agent_support: {type: string, enum: ["human_only", "agent_assisted", "agent_autonomous"]}
        short: {type: string, maxLength: 100}

    content:
      type: string
      description: "Initial file content (after header)"
      required: false
      default: ""

  validation:
    - File must not already exist
    - Path must be within project bounds
    - Headers must be valid YAML
    - Agent must have permission to create files in that location

  result:
    - Creates file with speclang-header
    - Returns success/failure with details
    - File watcher detects new file and triggers cascade
```

### Usage Example
```yaml
# Agent calls create_spec_file tool
tool_call:
  name: "create_spec_file"
  parameters:
    file_path: "specs/auth/handler.go.spec"
    headers:
      id: "@generated/auth/handler-go"
      version: "0.1.0"
      layer: 5
      produces: "generated/go/auth/handler.go"
      agent_support: "agent_autonomous"
      short: "Go handler for authentication"
    content: |
      # YAML schema content will go here
```

This tool allows agents to create new files while maintaining proper headers and triggering the cascade system.

## Commit Protocol

Agents must follow the commit protocol after writing files:

### @block::agent-protocol/commit-protocol @kind:protocol
```speclang
# @block:agent-protocol/commit-protocol @kind:protocol
CommitProtocol:
  requirement: "Every agent write = one git commit"

  steps:
    1. Generate UUID for this change
    2. Include parent UUID from trigger context
    3. Write file with optional causality headers
    4. Generate commit message from work summary
    5. Execute: git commit --only <file> -m "speclang: {summary} [change_id:{uuid} parent:{parent_uuid}]"

  uuid_generation:
    - Use cryptographically secure UUID v4
    - Store in agent session context
    - Pass to dependent agents as parent UUID

  commit_message_generation:
    - Extract key phrase from agent work summary
    - Format: "speclang: {action} {target}"
    - Add UUID metadata in brackets
    - Keep under 72 characters for git best practices

  causality_headers:
    - Optional: add `caused_by: "@change:{parent_uuid}"` to spec headers
    - Optional: add `change_id: "@change:{uuid}"` to spec headers
    - Helps reconstruct flow even if commits are out of order

  example:
    - Agent writes: specs/auth.scl
    - UUID: a1b2c3d, Parent: e4f5g6h
    - Commit: git commit --only specs/auth.scl -m "speclang: added auth entities [change_id:a1b2c3d parent:e4f5g6h]"

  tool_requirement:
    - Agents must have access to git CLI
    - Pi extension provides git wrapper
    - Commit happens automatically after successful write
```

### Integration with Git History System

The commit protocol integrates with @ref:specs/git-history to provide:
- Perfect traceability via per-file commits
- UUID-linked causality chains
- History querying for context
- Blame with agent attribution
- Rollback capability per file

This makes git the system's memory, replacing separate memory-bank systems.
