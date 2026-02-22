# speclang-header lines:11
id: "@speclang/headers"
version: 0.2.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [headers, metadata, parsing, efficiency]
imports: ["@speclang/core", "@speclang/spec-format"]
status: draft
short: Headers
---

# Headers

Universal headers for all files. Optional line count for efficiency.

## Overview

```speclang
# @block:headers/overview @kind:note
Every file has a header - specs, code, tests, everything.

The header format is language-aware:
- Line 1: Comment symbol or blank (depends on file type)
- Line 2 (optional): speclang-header declaration with line count
- Lines 3-N: Header content (YAML)

The line count is OPTIONAL but RECOMMENDED:
- Without it: Parser scans for `---` terminator
- With it: Parser reads exactly N lines (saves tokens, faster)

SQLite indexes headers for instant graph queries.
```

---

## Header Structure

### @headers/structure

```speclang
# @block:headers/structure @kind:entity
Header:
  line_1: language-specific comment or blank
  line_2: "# speclang-header" with optional " lines:N"
  lines_3_to_N: YAML metadata
  terminator: "---" (YAML document end)
  
  format_by_language:
    markdown:
      minimal:    # No line count - flexible
        line_1: "---"
        line_2: "# speclang-header"
        line_3-N: YAML content
        line_N+1: "---"
        
      efficient:  # With line count - recommended
        line_1: "---"
        line_2: "# speclang-header lines:8"
        line_3-8: YAML content
        line_9: "---"
        
    python:
      line_1: "#"
      line_2: "# speclang-header lines:10"
      lines_3_10: "# " prefixed YAML
      
    yaml_files:
      line_1: "#"
      line_2: "# speclang-header lines:12"
      lines_3_12: "# " prefixed YAML
      line_13: "---"
      
    go:
      line_1: "//"
      line_2: "// speclang-header lines:10"
      lines_3_10: "// " prefixed YAML
```

### @headers/example

```speclang
# @block:headers/example @kind:code

# RECOMMENDED (efficient):
--- speclang-header lines:14
id: @specs/auth
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
owned_by: spec-writer
depends_on:
  - @ref:northstar#auth
  - @ref:stdlib/Result
tags: [auth, security, jwt]
short: JWT authentication with rate limiting
target: go
status: stable
---

# ALSO VALID (flexible):
---
# speclang-header
id: @specs/auth
version: 1.0.0
...
---
```

---

## Line Declaration Format

### @headers/lines

```speclang
# @block:headers/lines @kind:entity
LineDeclaration:
  format: "<comment_prefix> speclang-header [lines:N]"
  
  the_lines_part_is_optional:
    - WITHOUT: Parser scans for `---` terminator
    - WITH: Parser reads exactly N lines (faster)
    - RECOMMENDED: Include lines:N for large files
    
  markdown_yaml:
    minimal: "# speclang-header"
    efficient: "# speclang-header lines:8"
    
  code_files:
    python: "# speclang-header lines:10"
    go: "// speclang-header lines:10"
    rust: "// speclang-header lines:10"
    c_cpp: "// speclang-header lines:10"
    
  purpose: 
    - Optional but recommended for large files
    - Models read just 2 lines to know header size
    - Saves tokens, faster parsing
    - Parser reads exactly N lines, no scanning needed
    
  examples:
    efficient_format:
      line_1: "---"
      line_2: "# speclang-header lines:8"
      lines_3_8: YAML content
      line_9: "---"
      content: starts at line 10
      advantage: "Parser stops at line 9, knows exact size"
      
    flexible_format:
      line_1: "---"
      line_2: "# speclang-header"
      lines_3+: YAML content
      terminator: "---"
      advantage: "Flexible, no line counting needed"
      tradeoff: "Parser must scan for terminator"
```

---

## Header Field Types

### @headers/field-types

```speclang
# @block:headers/field-types @kind:entity
HeaderFields:
  
  required:
    - id: "@domain/path" - unique identifier
    - version: "semver" - track changes
    
  relationships:
    - depends_on: array of @refs
      description: what this spec needs
      example: [@ref:northstar#auth, @ref:stdlib/Result]
      
    - refs: array of outgoing links
      description: specs this one points to
      example: [@ref:specs/jwt, @ref:specs/rate-limit]
      
    - children: array of sub-specs
      description: when split into .dir/
      example: [@ref:specs/auth.part1, @ref:specs/auth.part2]
      
    - parent: single @ref
      description: when this is part of split
      example: @ref:specs/auth
      
  metadata:
    - layer: integer (0-10) abstraction depth
    - project_level: POC | MVP | Alpha | Beta | Production | Startup | SMB | MSB | Enterprise
    - agent_support: human_only | agent_assisted | agent_autonomous
    - tags: [auth, security, jwt]
    - short: "One line description"
    - target: "go" | "ts" | "python" | etc
    - status: "draft" | "stable" | "deprecated"
    
  ownership:
    - owned_by: "agent-name"
    - session_id: "uuid"
    
  efficiency:
    - lines: N (optional but recommended)
    - line_count: N (computed, for validation)
```

For detailed semantic definitions of these fields, see:
- @ref:speclang/layer-definitions (layer)
- @ref:speclang/project-maturity-levels (project_level)
- @ref:speclang/agent-support-levels (agent_support)
- @ref:speclang/autonomous-validation (validation rules)

---

## Recommended Fields

### @headers/recommended

```speclang
# @block:headers/recommended @kind:entity
RecommendedFields:
  id:
    type: "@domain/path"
    required: true
    example: @specs/auth/login
    
  version:
    type: semver
    required: true
    example: 1.0.0
    
  lines:
    type: integer
    required: false
    recommended: true
    purpose: header line count for fast parsing
    
  layer:
    type: integer (0-10)
    purpose: abstraction depth

  project_level:
    type: enum
    values: POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise
    purpose: project maturity stage

  agent_support:
    type: enum
    values: human_only, agent_assisted, agent_autonomous
    purpose: readiness for autonomous agent usage
    
  owned_by:
    type: string
    purpose: which agent owns this file
    example: spec-writer, code-gen-go
    
  depends_on:
    type: array of @refs
    purpose: dependency graph
    example: [@ref:northstar#auth]
    
  tags:
    type: array of strings
    purpose: search and categorization
    
  short:
    type: string (one line)
    purpose: quick description
    
  target:
    type: string
    purpose: output language (go, ts, etc)
    
  status:
    type: enum
    values: draft, stable, deprecated
```

---

## Full Example

### @headers/full-spec

```speclang
# @block:headers/full-spec @kind:code
```yaml
--- speclang-header lines:16
id: @specs/auth/login
version: 2.1.0
layer: 3
project_level: Alpha
agent_support: agent_autonomous
owned_by: spec-writer
depends_on:
  - @ref:northstar#auth
  - @ref:specs/auth/entities
  - @ref:stdlib/Result
  - @ref:stdlib/JWT
tags: [auth, login, jwt, rate-limit]
short: Login operation with JWT and rate limiting
target: go
status: stable
generated:
  - generated/go/auth/login.go
  - tests/auth/login.test.spec.scl
---

# @block:auth/login @kind:operation
login(email: String, password: String) -> Result<Token, Error>
...
```

# Alternative without lines count (also valid):
---
# speclang-header
id: @specs/auth/login
version: 2.1.0
...
---
```
```

---

## Code File Headers

### @headers/code-files

```speclang
# @block:headers/code-files @kind:note
Generated code files also have headers (as comments).
The lines:N is especially useful for code files since
they can be very large. Always include it for efficiency.
```

### @headers/code-example

```speclang
# @block:headers/code-example @kind:code
```go
// --- speclang-header lines:10
// id: @generated/go/auth/login
// spec: @ref:specs/auth#login
// northstar: @ref:northstar#auth
// version: 1.0.0
// generated_at: 2024-01-15T10:30:00Z
// generated_by: code-gen-go
// target: go
// ---

package auth

func Login(email, password string) (*Token, error) {
    // implementation
}
```
```

---

## Header Parsing

### @headers/parsing

```speclang
# @block:headers/parsing @kind:operation
parseHeader(file: File) -> Header:

steps:
  1. Read first line (comment or ---)
  2. Read second line, check for "speclang-header"
  3. IF line 2 contains " lines:N":
       - Extract N
       - Read exactly N-2 more lines
       - Parse lines 2-N as YAML
  4. ELSE:
       - Read lines until "---" terminator
       - Parse accumulated YAML
  5. Return Header object

optimization:
  - WITH lines:N: O(1) header size known upfront
  - WITHOUT lines:N: O(N) scan for terminator
  - Both valid, lines:N recommended for large files
  - SQLite caches parsed headers
  
algorithm:
  ```python
  def parse_header(file_path):
      with open(file_path) as f:
          line1 = f.readline()
          line2 = f.readline()
          
          if 'lines:' in line2:
              n = extract_line_count(line2)
              header_lines = [line2] + [f.readline() for _ in range(n-2)]
          else:
              header_lines = [line2]
              while True:
                  line = f.readline()
                  if line.strip() == '---':
                      break
                  header_lines.append(line)
          
          return yaml.safe_load('\n'.join(header_lines))
  ```
```

---

## SQLite Indexing

### @headers/sqlite

```speclang
# @block:headers/sqlite @kind:entity
HeaderIndex:
  on_file_edit:
    1. parse header (use lines:N if present)
    2. extract all fields
    3. compute content hash
    4. update SQLite
    
  queries_supported:
    - find by id
    - find by level
    - find by tag
    - find dependents
    - find dependencies
    - find by owner
    - find by content hash (deduplication)
    
  benefits:
    - instant graph queries
    - no file parsing needed
    - efficient dependency tracking
    - content hash tracking for version control
```

---

## Header in Markdown

### @headers/markdown

```speclang
# @block:headers/markdown @kind:code
```markdown
---
# speclang-header lines:10
id: @specs/auth
version: 1.0.0
layer: 1
depends_on:
  - @ref:northstar#auth
tags: [auth]
short: Authentication system overview
---

# Authentication

This spec describes the auth system...
```

# Without lines count:
---
# speclang-header
id: @specs/auth
...
---
```
```

---

## Header in YAML Spec

### @headers/yaml

```speclang
# @block:headers/yaml @kind:code
```yaml
# speclang-header lines:8
id: @specs/auth/entities
version: 1.0.0
layer: 2
depends_on:
  - @ref:specs/auth
tags: [entities, user]
---

entities:
  - name: User
    fields:
      - id: UUID
      - email: String
```
```

---

## Validation

### @headers/validation

```speclang
# @block:headers/validation @kind:entity
HeaderValidation:
  on_edit:
    - check required fields present (id, version)
    - check id format is valid
    - check version is semver
    - check depends_on refs exist (warn if not)
    - check owned_by is valid agent
    - if lines:N present, validate it matches actual count
    
  on_failure:
    - log error
    - block cascade (optional)
    - notify orchestrator
    
  recovery:
    - suggest fixes
    - auto-format if possible
    - suggest adding lines:N if missing
    
  warnings:
    - lines:N missing on large file (>100 lines)
    - depends_on refs that don't exist yet
    - owned_by agent not registered
```

---

## Best Practices

### @headers/best-practices

```speclang
# @block:headers/best-practices @kind:note
Best Practices:

  1. Always use lines:N:
     - Recommended for all files
     - Required for files >100 lines
     - Makes parsing much faster
     - Saves LLM tokens
     
  2. Keep headers concise:
     - 8-15 lines is typical
     - Put long descriptions in body
     - Use short: for summary
     
  3. Use standard fields:
     - id, version, lines (always)
     - owned_by, depends_on (usually)
     - tags, short (helpful)
     - target, status (when relevant)
     
  4. Validate early:
     - Check header on every save
     - Fix before cascade
     - Keep headers valid
```
