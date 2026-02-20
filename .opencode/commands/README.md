# OpenCode Commands

Custom commands for repetitive tasks in Speclang.

## What are Commands?

Commands are user-facing CLI commands that:
- Run specific workflows
- Trigger agent actions
- Query system state
- Manage the project

## Command Structure

Each command is defined in a markdown file with frontmatter:

```yaml
---
name: command-name
description: Brief description of what the command does
syntax: "command-name [args]"
subtask: false
---

# Command Name

Detailed documentation here...
```

## Available Commands

### Core Commands

- `/expand` - Trigger spec expansion
- `/build` - Run build pipeline
- `/test` - Run tests
- `/validate` - Validate current spec
- `/status` - Check cascade status

### Debug Commands

- `/cascade-log` - Show recent cascade events
- `/cascade-graph` - Visualize dependencies
- `/why <file>` - Show what triggered a file
- `/agents` - List active agents

### Management Commands

- `/finalize` - Force convergence
- `/recover` - Trigger recovery
- `/rollback <file>` - Rollback specific file
- `/split <file>` - Manually split a file
- `/merge <file>` - Merge split files

### Query Commands

- `/search <query>` - Search specs
- `/find <id>` - Find spec by ID
- `/dependents <file>` - Find dependents
- `/tree <file>` - Show dependency tree

## Command Usage

```bash
# In OpenCode chat
/expand specs/auth

# Or with args
/build --force
/test --watch
```

## Adding New Commands

1. Create a new `.md` file in this directory
2. Define the command using frontmatter
3. Document usage and examples
4. Restart OpenCode to load

## Implementation

Commands are implemented as:
- MCP tools
- SQLite queries
- Agent spawns
- Direct actions

## References

- SIP 8: Configuration
- OpenCode Commands documentation