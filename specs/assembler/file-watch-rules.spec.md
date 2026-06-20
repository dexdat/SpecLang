# speclang-header lines:9
id: "@speclang/assembler/file-watch-rules"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [assembler, watch, patterns, glob, notification-graph]
status: draft
short: "Watch pattern matching rules for the notification graph"
---

# File Watch Rules

The notification graph is built from three sources: `depends_on` refs, `watch.files` patterns, and body `@ref:` links. This spec details how watch patterns are matched.

## Pattern Types

### Literal Paths

Exact file paths. Matches only the specified file.

```yaml
watch:
  files:
    - "specs/cron-system/cron-system.spec.md"
```

### Glob Patterns

Shell-style glob patterns using micromatch or minimatch.

```yaml
watch:
  files:
    - "specs/**/*.spec.md"          # All spec files recursively
    - "specs/sdk/cron-driver/*.spec.md"  # Specs in a specific directory
    - "**/*.spec.ts.md"             # TypeScript code-pair specs anywhere
```

Supported glob features:
- `*` — Matches any characters except `/`
- `**` — Matches any characters including `/`
- `?` — Matches a single character
- `{a,b}` — Braces pattern matching
- `[abc]` — Character class

### Exclude Patterns

Prevent certain paths from triggering notifications.

```yaml
watch:
  exclude:
    - "specs/legacy/**"             # Entire legacy directory
    - "specs/**/deprecated.spec.md" # Specific deprecated files everywhere
```

## Matching Algorithm

```
For each file change event at path P:
  1. Read changed file's header (if it has one)
  2. Query notification graph for all specs that watch P:
     a. Check literal patterns: P matches watch.files literal entries
     b. Check glob patterns: P matches watch.files glob entries
     c. Check body @ref: links: any spec that @ref:s P
     d. Check depends_on refs: any spec with P in its depends_on
  3. Remove any matches that are in watch.exclude for that spec
  4. Merge all sources into unique set of dependent spec IDs
  5. Emit FileChangeEvent with dependent_specs[]
```

## Notification Graph Update Triggers

The notification graph is rebuilt when:

| Event | Action |
|-------|--------|
| Spec file created | Parse header & body, add edges to graph |
| Spec file modified | Re-parse header & body, update edges |
| Spec file deleted | Remove all edges for this spec |
| Header field changed | Update edges from watch patterns |
| Body @ref: changed | Update edges from ref links |

## Performance

- Notification graph stored in memory (Map<path, Set<specId>>)
- Persisted to SQLite for recovery after restart
- Updates are O(n) where n = number of watch patterns
- Lookups are O(1) — direct map access
- Globs compiled to regex on first use, cached

## See Also

- @ref:specs/daemon - Watch patterns section
- @ref:specs/cascade - Notification graph section
- @ref:specs/headers - Header fields (watch section)
