# speclang-header lines:12
id: "@speclang/agent-protocol"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [agents, protocol, ownership, sessions, guard]
children:
  - "@ref:specs/agent-protocol.spec.dir/types  - "@ref:specs/agent-protocol.spec.dir/sessions  - "@ref:specs/agent-protocol.spec.dir/ownership  - "@ref:specs/agent-protocol.spec.dir/rules  - "@ref:specs/agent-protocol.spec.dir/registry  - "@ref:@ref:specs/agent-protocol.spec.dir/interceptor  - "@ref:specs/agent-protocol.spec.dir/violations
short: "Agent Protocol - Ownership, sessions, and write guards"
status: draft
---

# Agent Protocol

Protocol defining agent roles, file ownership, session management, and write guards to prevent conflicts in the reactive cascade.

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
    - pipeline: Executes build/test/deploy after convergence
  
  ownership_rules:
    - pattern_based: "specs/**/*.spec.md" → spec_writer
    - pattern_based: "src/**/*.go" → code_gen
    - explicit: Header field `owned-by:` overrides pattern
    - inheritance: Sub-specs inherit parent's owner
  
  guard_system:
    - plugin: OpenCode plugin intercepts write attempts
    - validation: Checks ownership before allowing write
    - logging: Records violations for debugging
    - override: User session can write anywhere
```

## Components

- **Types**: @ref:specs/agent-protocol.spec.dir/types - Data structures and type definitions
- **Sessions**: @ref:specs/agent-protocol.spec.dir/sessions - Agent session lifecycle and state
- **Ownership**: @ref:specs/agent-protocol.spec.dir/ownership - File ownership tracking and rules
- **Rules**: @ref:specs/agent-protocol.spec.dir/rules - Default and custom ownership rules
- **Registry**: @ref:specs/agent-protocol.spec.dir/registry - Agent registry and lookup
- **Interceptor**: @ref:specs/agent-protocol.spec.dir/interceptor - Write interception implementation
- **Violations**: @ref:specs/agent-protocol.spec.dir/violations - Violation tracking and reporting

## Integration with OpenCode

The agent protocol is enforced via an OpenCode plugin (`speclang-guard`) that:

1. Intercepts file write attempts
2. Checks if the agent owns the file (by pattern or header)
3. Allows writes from user-controlled sessions (whitelist)
4. Blocks unauthorized writes and logs violations
5. Provides tools for ownership query and management

This prevents agents from stepping on each other's files during concurrent cascade execution.

## File Creation Tool

Agents can create new files via a dedicated tool (available in OpenCode plugin):

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
    - OpenCode plugin provides git wrapper
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

