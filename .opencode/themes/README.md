# OpenCode Themes

Custom themes for OpenCode UI.

## What are Themes?

Themes define:
- Color schemes
- UI styling
- Syntax highlighting
- Visual preferences

## Theme Structure

Each theme is defined in a markdown file with frontmatter:

```yaml
---
name: theme-name
description: Brief description
colors:
  primary: "#hexcolor"
  background: "#hexcolor"
  text: "#hexcolor"
---

Theme documentation and customization options.
```

## Available Themes

### speclang-dark
Dark theme optimized for spec reading.

### speclang-light
Light theme for daytime use.

## Configuration

```yaml
# .opencode/opencode.jsonc
themes:
  speclang-dark:
    colors:
      primary: "#4CAF50"
      background: "#1E1E1E"
      text: "#D4D4D4"
      header: "#569CD6"
      block: "#4EC9B0"
      ref: "#CE9178"
```

## Speclang-Specific Styling

### Headers
- Distinct color for line 2 (speclang-header)
- YAML syntax highlighting
- Reference links clickable

### Blocks
- Block declarations highlighted
- Kind badges (entity, operation, etc.)
- References underlined

### References
- Clickable @ref links
- Hover preview
- Navigation support

### Spec Files
- `.spec.md` - Markdown with YAML
- `.spec.yaml` - Pure YAML
- `*.go.spec` - Code specs

## Adding New Themes

1. Create a new `.md` file in this directory
2. Define colors in frontmatter
3. Customize for spec viewing
4. Set in OpenCode config
5. Restart OpenCode to load

## References

- OpenCode Themes documentation