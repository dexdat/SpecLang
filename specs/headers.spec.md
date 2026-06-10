---
id: "@speclang/headers"
version: 0.3.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [headers, format, front-matter, metadata]
short: "Universal Headers - YAML front matter format for all SpecLang files"
status: active
---

# Universal Headers

Standard YAML front matter for all SpecLang files. Provides metadata, dependencies, and context to prevent AI context loss.

## Overview

Every SpecLang file begins with standard YAML front matter delimited by `---`:

```yaml
---
id: "@specs/example"
version: 1.0.0
layer: 0
target_lang: go
output: internal/example/example.spec.go
owned-by: codegen
model: openai/gpt-4o
model_pool: code-gen
max_concurrent: 3
rate_limit: 5
quality: production
seed: false
tags: [example, docs]
short: Brief description
depends_on:
  - "@ref:specs/other"
watch:
  files:
    - "specs/other/*.spec.md"
  exclude:
    - "specs/other/legacy.spec.md"
status: active
---
```

## Header Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier in format `@domain/path` |
| `version` | Yes | Semantic version (e.g., 1.0.0) |
| `layer` | Yes | Depth in dependency tree (0=root, increasing for deeper nodes) |
| `project_level` | Yes | POC, MVP, Alpha, Beta, Production, etc. |
| `agent_support` | Yes | human_only, agent_assisted, agent_autonomous |
| `tags` | No | Keywords for search and categorization |
| `short` | Yes | One-line description |
| `target_lang` | Yes (for code-pair specs) | Target language (go, ts, py, rs, java, rb, php, c, rs, etc.) |
| `output` | Yes (for code-pair specs) | Output path for generated code file |
| `owned-by` | Yes (for code-pair specs) | Agent role (northstar, spec-writer, codegen, test-writer, back-sync, assembler) |
| `model` | No | Explicit model override (e.g., openai/gpt-4o) |
| `model_pool` | No | Named capability pool for model selection |
| `max_concurrent` | No | Max concurrent agent sessions for this spec |
| `rate_limit` | No | Rate limit per minute for cascade triggers |
| `quality` | No | production or downgrade (providers with reduced context/quality) |
| `seed` | No | true = human-written source, false = agent-generated |
| `watch` | No | File patterns to watch for changes |
| `watch.files` | No | List of file paths/globs to watch |
| `watch.exclude` | No | List of paths/globs to exclude from watch |
| `depends_on` | No | List of `@ref:` dependencies |
| `children` | No | List of child spec IDs (for index specs) |
| `parent` | No | Parent spec ID (for sub-specs) |
| `part` | No | Part number for split specs (e.g., "2/5") |
| `status` | No | draft, active, deprecated, generated |
| `caused_by` | No | Cascade change ID that triggered this |
| `change_id` | No | This file's cascade change ID |
| `part_of` | No | Cascade ID this change belongs to |

## Purpose

Universal headers enable:

1. **Zero context loss**: AI agents read header to understand file purpose
2. **Dependency graph**: `depends_on` + `watch` create traceable notification graph
3. **Model control**: `model` / `model_pool` fields control which LLM assembles this file
4. **Rate limiting**: `max_concurrent` + `rate_limit` per spec, pooled by provider
5. **Validation**: Required fields ensure spec completeness; git hooks check format
6. **Autonomous operation**: `agent_support` + `owned-by` guide agent behavior

## Why YAML Front Matter

Standard `---` delimited YAML front matter:

- Is recognized by every markdown parser (GitHub, Obsidian, Notion, etc.)
- Does not interfere with the target language's compiler or interpreter
- The 1:1 pair between `{name}.spec.{lang}.md` and `{name}.spec.{lang}` makes matching trivial
- No need for custom `# speclang-header lines:N` syntax — the `---` delimiters are unambiguous

## Git Hook Validation

A pre-commit git hook validates every `.spec.md` and `.spec.{lang}.md` file:

- Front matter must have valid YAML syntax
- All required fields must be present (id, version, layer, target_lang if code-pair, owned-by if code-pair)
- All `@ref:` links must resolve to existing files
- Rejects commit if any spec has a broken header

## See Also

- @ref:specs/spec-format.spec.dir/structure - Spec file structure
- @ref:specs/spec-format.spec.dir/blocks - Content block formats
