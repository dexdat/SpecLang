# speclang-header lines:23
# id: @specs/agents
# version: 1.0.0
# layer: 5

# OpenCode Agents

Custom agent definitions for Speclang.

## What are Agents?

Agents in Speclang are AI assistants that:
  - "Own specific files or file patterns"
  - "React to file changes"
  - "Write new files"
  - "Coordinate through the cascade system"

## Agent Structure

Each agent is defined in a markdown file with frontmatter:

```yaml
---
name: agent-name
version: 0.1.0
description: Brief description
trigger: When this agent runs
permissions:
  - read
  - write
owns: files/**/*.pattern
subagent: true
---

# Agent Name

Detailed documentation here...
```

## Core Agents

### north-star
Top-level orchestrator. Manages project.scl and coordinates all other agents.

### spec-writer
Expands high-level specs into detailed specifications.

### code-gen
Generates code specs (*.go.spec, *.ts.spec, etc.).

### test-writer
Writes test specs and generates test code.

## Support Agents

### back-sync
Syncs human edits in code back to specs.

### adversarial-reviewer
Reviews specs for edge cases and security issues.

### recovery-agent
Handles failures and rollbacks.

### spec-validator
Validates specs before cascade.

### speclang-simulator
Simulator agent that autonomously writes spec files, commits per‑file, simulates reactive cascade, mimics multi‑agent behavior, and self‑improves within OpenCode constraints.

## Agent Lifecycle

```
Created → Idle → Active → Done/Error
```

## File Ownership

Each agent owns specific file patterns:

| Agent | Owns |
|-------|------|
| north-star | project.scl (exempt from rules) |
| spec-writer | specs/**/*.spec.* |
| code-gen | specs/**/*.go.spec, *.ts.spec, etc. |
| test-writer | specs/**/*.test.spec.* |
| back-sync | Any code spec file |
| speclang-simulator | All specs (autonomous write/edit with safety boundary) |

## Communication

Agents communicate via:
- **SQLite** - Commands table
- **MCP** - Tools and queries
- **Events** - File change events
- **Git** - Commits per agent

## Adding New Agents

1. Create a new `.md` file in this directory
2. Define the agent using frontmatter
3. Document the agent's purpose and workflow
4. Restart OpenCode to load

## References

- SIP 6: Agent Protocol
- SIP 7: Cascade System