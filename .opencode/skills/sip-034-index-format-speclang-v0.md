---
name: sip-034-index-format-speclang-v0
title: "SIP 34: Index File Format"
version: 0.1.0
description: Defines the _index JSON format for aggregating file headers
category: system
---

# SIP 34: Index File Format

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the `_index` JSON format - a machine-readable index of all spec files for easy model access without requiring SQLite database queries.

### Quick Start

1. **What is it?** JSONL file with one JSON object per file
2. **Purpose:** Models can quickly understand project structure
3. **Format:** Each line is a JSON object with header metadata
4. **Location:** Project root as `_index.json`

### Core Ideas

- **Fast Access:** Models read index instead of parsing headers
- **Complete Picture:** All files and relationships in one file
- **Auto-Generated:** Index maintained automatically
- **Portable:** Works without SQLite database

### When to Read This

- **Model implementers:** How to read/write the index
- **Tool developers:** How to generate/maintain the index
- **System architects:** Understanding the index's role

### Related SIPs

- SIP 2: Header Format (source of data)
- SIP 4: Reference System (how refs work)
- SIP 5: Splitting and Sizing (affects file count)

## Abstract

The `_index` file provides a machine-readable summary of all spec files in a Speclang project. It aggregates header metadata into a JSONL format that models can query without needing to parse individual files or access the SQLite database. This enables fast project comprehension and navigation.

## Rationale

Models need quick access to project structure to understand what exists and how files relate. While SQLite provides powerful queries, it requires database access and may not be available in all contexts. The `_index` file provides:

1. **Zero-dependency access:** Just read a JSON file
2. **Portability:** Works anywhere files can be read
3. **Simplicity:** No SQL knowledge required
4. **Efficiency:** Single read vs many file reads

## Specification

### File Location and Naming

```
project/
├── _index.json          # Primary index (JSONL format)
├── specs/
├── generated/
└── ...
```

Alternative names (checked in order):
1. `_index.json` (primary)
2. `index.json` (fallback)
3. `.speclang/index.json` (internal)

### JSONL Format

Each line is a valid JSON object (JSON Lines format). Empty lines are ignored.

```json
{
  "path": "relative/path/to/file",
  "id": "@specs/domain/name",
  "version": "semver",
  "layer": 0,
  "tags": ["tag1", "tag2"],
  "short": "One line description",
  "refs": ["@ref:other/spec"],
  "lines": 123,
  "modified": "2025-02-20T10:30:00Z",
  "header_lines": 8,
  "status": "draft",
  "target": "go",
  "depends_on": ["@ref:parent/spec"],
  "children": ["@ref:child/spec"]
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Relative path from project root |
| `id` | string | Unique identifier (@domain/path) |
| `version` | string | Semantic version (e.g., "1.0.0") |

### Recommended Fields

| Field | Type | Description |
|-------|------|-------------|
| `layer` | integer | Abstraction level (0-10) |
| `tags` | string[] | Categorization tags |
| `short` | string | One-line description |
| `refs` | string[] | Outgoing @ref: pointers |
| `lines` | integer | Total lines in file |
| `modified` | string | ISO 8601 timestamp |
| `header_lines` | integer | Number of header lines |
| `status` | string | "draft" \| "stable" \| "deprecated" |
| `target` | string | Output language ("go", "ts", etc.) |
| `depends_on` | string[] | Parent/sibling references |
| `children` | string[] | Child references (for splits) |

### Field Sources

- `path`, `lines`, `modified`: File system metadata
- All other fields: Parsed from file header
- `refs`: Combined from `depends_on` + `refs` + `children` headers

## Generation Rules

### When to Update

The index should be updated:
1. **On file change:** After any file is written
2. **On file creation:** When new file added
3. **On file deletion:** When file removed
4. **Manual refresh:** `speclang index --refresh`

### Update Algorithm

```speclang
# @block:index/generation @kind:operation
generate_index():
  1. Scan project for all spec files
  2. For each file:
     a. Parse header (first N lines)
     b. Extract metadata fields
     c. Get file stats (lines, modified)
  3. Write JSONL to _index.json
  4. Optionally sort by path, layer, or id
```

### Performance Considerations

- **Incremental updates:** Update only changed files
- **Background generation:** Don't block user operations
- **Caching:** Keep parsed headers in memory
- **Validation:** Verify JSONL is valid after write

## Usage

### By Models

Models can read the index to:
- Understand project scope
- Find files by tag or layer
- Follow dependency chains
- Get quick context without file parsing

Example query pattern:
```javascript
// Find all auth-related specs
const authSpecs = index.filter(item => 
  item.tags.includes('auth') || 
  item.id.includes('@specs/auth')
);

// Find dependents of a spec
const dependents = index.filter(item =>
  item.depends_on?.includes('@ref:specs/auth')
);
```

### By Tools

Tools can use the index for:
- **Navigation:** Jump to related files
- **Search:** Find by content or metadata
- **Analysis:** Project metrics and health
- **Documentation:** Generate project overview

### By System

The Speclang system uses the index for:
- **Cold start:** Quick project loading
- **Fallback:** When SQLite unavailable
- **Debugging:** Understand file relationships
- **Migration:** Track changes over time

## Examples

### Minimal Entry
```json
{"path": "specs/auth.scl", "id": "@specs/auth", "version": "1.0.0"}
```

### Full Entry
```json
{
  "path": "specs/auth/login.go.spec.yaml",
  "id": "@specs/auth/login",
  "version": "2.1.0",
  "layer": 3,
  "tags": ["auth", "login", "jwt", "rate-limit"],
  "short": "Login operation with JWT and rate limiting",
  "refs": ["@ref:specs/auth/entities", "@ref:stdlib/JWT"],
  "lines": 45,
  "modified": "2025-02-20T10:30:00Z",
  "header_lines": 12,
  "status": "stable",
  "target": "go",
  "depends_on": ["@ref:northstar#auth"],
  "children": []
}
```

### Split File Entry
```json
{
  "path": "specs/auth.spec.spec.dir/entities.spec.yaml",
  "id": "@specs/auth.spec.spec.dir/entities",
  "version": "1.0.0",
  "layer": 2,
  "tags": ["auth", "entities"],
  "short": "Auth entities (User, Session, Token)",
  "refs": [],
  "lines": 120,
  "modified": "2025-02-20T10:30:00Z",
  "header_lines": 8,
  "status": "draft",
  "target": null,
  "depends_on": ["@ref:specs/auth"],
  "children": [],
  "part": 1,
  "total_parts": 3
}
```

## Implementation Notes

### File Extensions Covered

The index should include:
- `.scl` files
- `.spec.md` files
- `.spec.yaml` files
- `.{ext}.spec` files (e.g., `.go.spec`)
- Generated code files with headers
- Test spec files

### Exclusions

The index should exclude:
- Binary files
- Temporary files
- Files without valid headers
- `.gitignore` patterns

### Sorting

Recommended sort order:
1. By `layer` (ascending)
2. By `path` (alphabetical)
3. By `modified` (descending)

Optional: Provide sorted views via query parameters.

## Compatibility

### Backward Compatibility

- Version 0: JSONL format as described
- Future versions: May add fields, never remove required fields

### Forward Compatibility

- Unknown fields should be ignored
- Missing fields should be treated as null/empty
- Schema version may be added in future

## Security Considerations

- The index contains only public metadata
- No secrets or sensitive data
- File paths are relative, not absolute
- Can be safely committed to version control

## References

- JSON Lines format: https://jsonlines.org/
- ISO 8601 timestamp format
- SIP 2: Header Format
- SIP 4: Reference System

## Appendix: Example Index File

```
{"path": "project.scl", "id": "@northstar/speclang", "version": "0.2.0", "layer": 0, "tags": ["northstar"], "short": "North Star file", "lines": 50, "modified": "2025-02-20T10:00:00Z"}
{"path": "specs/auth.scl", "id": "@specs/auth", "version": "1.0.0", "layer": 1, "tags": ["auth"], "short": "Authentication system", "lines": 100, "modified": "2025-02-20T10:05:00Z"}
{"path": "specs/auth/login.go.spec.yaml", "id": "@specs/auth/login", "version": "2.1.0", "layer": 3, "tags": ["auth", "login"], "short": "Login operation", "lines": 45, "modified": "2025-02-20T10:30:00Z"}
```

## Change History

- v0.1.0: Initial specification