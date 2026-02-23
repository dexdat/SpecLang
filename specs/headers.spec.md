# speclang-header lines:12
id: "@speclang/headers"
version: 0.2.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [headers, format, universal, metadata]
children:
  - "@ref:specs/spec-format.spec.dir/structure"
  - "@ref:specs/spec-format.spec.dir/blocks"
short: "Universal Headers - Metadata format for all SpecLang files"
status: draft
---

# Universal Headers

Standard header format for all SpecLang files. Provides metadata, dependencies, and context to prevent AI context loss.

## Overview

Every SpecLang file begins with a universal header that declares:

```yaml
# speclang-header lines:15
id: "@specs/example"
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [example, docs]
short: Brief description
depends_on:
  - "@ref:specs/other#block"
caused_by: "@commit:abc123def"    # optional: commit hash that triggered this
change_id: "@commit:def456ghi"    # optional: this commit's hash
part_of: "@cascade:20250222-001" # optional: cascade this belongs to
---
```

## Header Fields

| Field | Required | Description |
|-------|-----------|-------------|
| `id` | Yes | Unique identifier in format `@domain/path#block` |
| `version` | Yes | Semantic version (e.g., 1.0.0) |
| `layer` | Yes | Depth in dependency tree (0=root/north star, increasing for deeper nodes) |
| `project_level` | Yes | POC, MVP, Alpha, Beta, Production, etc. |
| `agent_support` | Yes | human_only, agent_assisted, agent_autonomous |
| `tags` | No | Keywords for search and categorization |
| `short` | Yes | One-line description |
| `depends_on` | No | List of `@ref:` dependencies |
| `children` | No | List of child spec IDs (for index specs) |
| `parent` | No | Parent spec ID (for sub-specs) |
| `part` | No | Part number for split specs (e.g., "2/5") |
| `status` | No | draft, active, deprecated, generated |
| `caused_by` | No | Commit hash that triggered this (e.g., "@commit:abc123def") |
| `change_id` | No | This commit's hash (e.g., "@commit:def456ghi") |
| `part_of` | No | Cascade ID this change belongs to (e.g., "@cascade:20250222-001") |

## Purpose

Universal headers enable:

1. **Zero context loss**: AI agents read header to understand file purpose
2. **Dependency graph**: `depends_on` creates traceable graph to North Star
3. **Searchability**: SQLite FTS indexes headers for instant querying
4. **Validation**: Required fields ensure spec completeness
5. **Autonomous operation**: `agent_support` field guides AI behavior

## Implementation

See @ref:specs/spec-format.spec.dir/structure for detailed header structure and parsing rules.

See @ref:specs/spec-format.spec.dir/blocks for content block formats following the header.