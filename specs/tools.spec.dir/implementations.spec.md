# speclang-header lines:12
id: "@speclang/tools/implementations"
version: 0.1.0
layer: 2
parent: "@speclang/tools"
part: 2/2
tags: [tools, implementation, skills]
imports: ["@speclang/core", "@speclang/pi-integration"]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Agent Tools Implementation
---

# Agent Tools Implementation

Tools available to Speclang agents via the plugin.

## Overview

```speclang
# @block:tools/overview @kind:note
Agents don't directly access the filesystem.
They use tools provided by the Speclang plugin.

This enables:
- Ownership enforcement
- Audit logging
- Error recovery
- Efficient operations
```

---

## Tool Usage in Skills

### @tools/skill-usage

```speclang
# @block:tools/skill-usage @kind:code
```markdown
# SKILL.md example

You have access to these tools:

- speclang_create_spec: create new specs
- speclang_read_file: read any file
- speclang_read_header: read header only
- speclang_find_dependents: find what depends on a spec
- speclang_get_tree: get parent and children

Example usage:

Use speclang_read_header("specs/auth.scl") to quickly understand
the auth spec without reading the full file.

Use speclang_find_dependents("@specs/auth") to see what needs
updating when you change auth.
```
```

