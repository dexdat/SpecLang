# OpenCode Prompts

Prompt templates for various tasks in Speclang.

## What are Prompts?

Prompt templates provide:
- Reusable prompt structures
- Variable substitution
- Consistent formatting
- Task-specific context

## Prompt Structure

Each prompt template is defined in a markdown file with frontmatter:

```yaml
---
name: prompt-name
description: Brief description
trigger: when to use this prompt
variables:
  - variable: input
    description: What to provide
    required: true
---

Prompt template content with {{variable}} placeholders.
```

## Available Prompts

### Core Prompts

- `expand-spec` - Expanding a high-level spec
- `generate-code` - Generating code from spec
- `write-tests` - Writing test cases
- `review-spec` - Reviewing for issues

### Task Prompts

- `create-entity` - Creating entity blocks
- `create-operation` - Creating operation blocks
- `add-policy` - Adding policy blocks
- `split-spec` - Splitting large specs

### Debug Prompts

- `explain-cascade` - Explain cascade behavior
- `find-dependents` - Find what depends on a file
- `show-graph` - Show dependency graph

## Usage

Prompts are used by:
- Agents
- Commands
- Skills
- User interactions

## Template Format

```markdown
---
name: expand-spec
description: Expand a high-level spec into details
variables:
  - name: spec_path
    description: Path to the spec file
    required: true
  - name: parent_context
    description: Context from parent spec
    required: false
---

Expand the spec at {{spec_path}}.

Context: {{parent_context}}

Please:
1. Read the spec
2. Identify entities, operations, policies
3. Write detailed blocks
4. Add proper refs
5. Check size limits
```

## Adding New Prompts

1. Create a new `.md` file in this directory
2. Define variables in frontmatter
3. Write template with {{variable}} placeholders
4. Reference in skills or agents
5. Restart OpenCode to load

## References

- SIP 3: Block System
- SIP 6: Agent Protocol