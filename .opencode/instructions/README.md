# OpenCode Instructions

Custom AI instructions and system prompts for Speclang.

## What are Instructions?

Instructions provide:
- System prompts for agents
- Context for specific tasks
- Guidelines for AI behavior
- Domain-specific knowledge

## Instruction Structure

Each instruction set is defined in a markdown file:

```markdown
# Instruction Name

## System Prompt

The system prompt text...

## Guidelines

- Guideline 1
- Guideline 2

## Examples

Example usage...
```

## Available Instructions

### Core Instructions

- `speclang-overview` - General Speclang context
- `agent-prompts` - How to be a Speclang agent
- `cascade-behavior` - Understanding the cascade

### Domain Instructions

- `security-review` - Security best practices
- `test-writing` - How to write good tests
- `code-generation` - Language-specific patterns

## Usage

Instructions are loaded:
- When spawning agents
- For specific tasks
- Via context menus
- In skills

## Format

```markdown
# speclang-agent

You are a Speclang agent. You:
- Own specific files
- React to changes
- Write specs or code
- Follow the cascade

Always:
- Use proper headers
- Add refs
- Stay within limits
- Git commit when done
```

## Adding New Instructions

1. Create a new `.md` file in this directory
2. Define the instruction set
3. Reference it in skills or agents
4. Restart OpenCode to load

## References

- SIP 0: What is Speclang
- SIP 6: Agent Protocol