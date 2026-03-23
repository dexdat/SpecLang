# speclang-header lines:11
id: "@speclang/scripts.generate-opencode-plugin"
version: 0.1.0
layer: 2
tags: [scripts, generation, opencode]
parent: ""@ref:speclang/scripts"status: draft
project_level: Alpha
agent_support: agent_assisted
short: Generate OpenCode Plugin Script
target: scripts/generate_opencode_plugin.py
---

# Generate OpenCode Plugin Script

Generates OpenCode plugin from SpecLang definitions. Creates integration plugins that connect OpenCode editor with the SpecLang system.

## Overview

```speclang
# @block:overview @kind:note
The generate-opencode-plugin script creates OpenCode plugin implementations
from spec definitions. It generates TypeScript/JavaScript code that integrates
with OpenCode's plugin API for spec editing, validation, and triggering.
```

## Purpose

```speclang
# @block:purpose @kind:note
OpenCode plugins extend the editor with custom functionality. This script:
1. Generates plugin code from spec definitions
2. Creates custom skills for spec editing
3. Sets up event handlers for spec changes
4. Configures tool integrations
```

## Plugin Components

```speclang
# @block:components @kind:entity
PluginComponents:
  manifest:
    - name, version, description
    - activation events
    - contributed commands
    - configuration schema
  
  commands:
    - spec-create: Create new spec
    - spec-validate: Validate spec
    - spec-expand: Expand spec blocks
  
  skills:
    - Custom skills for spec editing
    - Context providers
    - Completion providers
  
  tools:
    - Query specs database
    - Trigger cascade
    - Read/write spec files
```

## Implementation

```speclang
# @block:implementation @kind:function
def generate_opencode_plugin(spec_path: str, output_dir: str, options: dict) -> dict:
    """
    Generate OpenCode plugin from spec definitions.
    
    Args:
        spec_path: Path to plugin spec definition
        output_dir: Directory to write plugin files
        options: Plugin type and configuration options
    
    Returns:
        Dict with files_generated, plugin_config, errors
    """
```

## Algorithm

```speclang
# @block:algorithm @kind:note
1. Parse plugin spec definition
2. Extract plugin metadata (name, version, commands)
3. Generate package.json with dependencies
4. Create manifest.ts for plugin registration
5. Implement command handlers
6. Generate skill definitions
7. Create configuration UI (if needed)
8. Write all files to output directory
```

## Plugin Types

```speclang
# @block:types @kind:table
| Type | Description | Use Case |
|------|-------------|----------|
| editor | Spec editing enhancements | Syntax highlighting, completions |
| integration | Connect to SpecLang | Cascade triggers, DB queries |
| tools | Custom tool providers | Spec tools in OpenCode |
| skills | Custom skill definitions | AI-assisted spec writing |
```

## Output Files

```speclang
# @block:output @kind:entity
OutputStructure:
  plugin/
    ├── package.json
    ├── tsconfig.json
    ├── manifest.ts
    ├── src/
    │   ├── index.ts
    │   ├── commands.ts
    │   ├── skills.ts
    │   └── tools.ts
    └── tests/
        └── plugin.test.ts
```

## Usage

```speclang
# @block:usage @kind:note
# Generate OpenCode plugin from spec
python3 scripts/generate_opencode_plugin.py specs/opencode-plugin.spec.md

# Specify output directory
python3 scripts/generate_opencode_plugin.py specs/opencode-plugin.spec.md --output my-plugin/

# Generate with specific type
python3 scripts/generate_opencode_plugin.py specs/opencode-plugin.spec.md --type integration

# Generate with skills
python3 scripts/generate_opencode_plugin.py specs/opencode-plugin.spec.md --include-skills

# Dry run
python3 scripts/generate_opencode_plugin.py specs/opencode-plugin.spec.md --dry-run
```

## OpenCode Integration

```speclang
# @block:integration @kind:note
The generated plugin provides:
- Commands for spec operations
- Skills for AI-assisted editing
- Tools for spec database access
- Event handlers for file changes
- Custom completions for spec syntax
```

## Related Specs

```speclang
# @block:refs @kind:note
- @ref:speclang/opencode - OpenCode integration specification
- @ref:speclang/opencode-plugin - Plugin architecture
- @ref:speclang/skills - Skill definitions
- @ref:speclang/mcp - MCP server for tool access
```
