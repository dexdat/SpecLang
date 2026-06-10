# speclang-header lines:13
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
# speclang-header lines:28
id: "@specs/example"
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [example, docs]
short: Brief description
target_lang: go
output: generated/example/example.spec.go
owned-by: codegen
model: openai/gpt-4o
model_pool: code-gen
max_concurrent: 3
rate_limit: 5
quality: production
seed: false
depends_on:
  - "@ref:specs/other#block"
caused_by: "@commit:abc123def"
change_id: "@commit:def456ghi"
part_of: "@cascade:20250222-001"
watch:
  files:
    - "specs/other/*.spec.md"
  exclude:
    - "specs/other/legacy.spec.md"
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
| `target_lang` | Yes (for code-pair specs) | Target programming language (go, ts, py, rs, java, etc.) |
| `output` | Yes (for code-pair specs) | Output path for generated code file |
| `owned-by` | Yes (for code-pair specs) | Agent role responsible (northstar, spec-writer, codegen, test-writer, back-sync, assembler) |
| `model` | No | Explicit model override (e.g., openai/gpt-4o, openrouter/claude-3-opus) |
| `model_pool` | No | Named capability pool for model selection |
| `max_concurrent` | No | Max concurrent agent sessions for this spec |
| `rate_limit` | No | Rate limit per minute for cascade triggers |
| `quality` | No | production, downgrade (providers with reduced context/quality) |
| `seed` | No | true = human-written source, false = agent-generated |
| `watch` | No | File patterns to watch for changes |
| `watch.files` | No | List of file paths/globs to watch |
| `watch.exclude` | No | List of paths/globs to exclude from watch |
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
