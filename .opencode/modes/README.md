# OpenCode Modes

Custom modes that define agent behavior patterns for Speclang.

## What are Modes?

Modes define:
- How agents behave
- Which agents are active
- Default settings
- Context for tasks

## Mode Structure

Each mode is defined in a markdown file with frontmatter:

```yaml
---
name: mode-name
description: Brief description
agents:
  - default
  - developer
---

# Mode Name

Mode configuration and behavior documentation.
```

## Available Modes

### Primary Mode
Standard interactive mode for development.

### Subtask Mode
For spawning child agents. Used for:
- Parallel tasks
- Isolated work
- Background processing

### Build Mode
Headless mode for:
- CI/CD
- Automated builds
- Non-interactive use

### Review Mode
For adversarial review:
- Security analysis
- Edge case detection
- Design review

## Mode Configuration

### project.scl

```yaml
config:
  modes:
    default:
      agents: [spec-writer, code-gen]
      quiet_period: 30
    
    review:
      agents: [adversarial-reviewer]
      auto_spawn: false
```

## Usage

```bash
# Start in specific mode
opencode serve --mode=build

# Or switch modes
/mode build
/mode review
```

## Adding New Modes

1. Create a new `.md` file in this directory
2. Define the mode with frontmatter
3. Specify active agents
4. Restart OpenCode to load

## References

- SIP 7: Cascade System
- OpenCode Modes documentation