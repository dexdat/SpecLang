---
name: sip-002-header-format-speclang-v0
title: "SIP 2: Header Format"
version: 0.1.0
description: Universal header format for all Speclang files
category: standard
---

# SIP 2: Header Format

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines the universal header format for all Speclang files.

### Quick Start

1. **Line 1:** Comment or blank (language-specific)
2. **Line 2:** `# speclang-header lines:N`
3. **Lines 3-N:** YAML metadata
4. **After N:** Content begins

### Example

```yaml
---
# speclang-header lines:8
id: @specs/auth
version: 1.0.0
tags: [auth, security]
short: Authentication system
---
```

### Key Concepts

- **Two-Line Declaration:** Parser reads 2 lines to know header size
- **Language Aware:** Markdown, Go, Python all have same structure
- **Required Fields:** `id`, `version`
- **Optional Fields:** `refs`, `tags`, `depends_on`, etc.

### When to Read This

- **Implementing parsers:** Understand header structure
- **Writing specs:** Create proper headers
- **AI agents:** Learn how to read/write headers

### Related SIPs

- SIP 3: Block System
- SIP 4: Reference System
- SIP 5: Splitting and Sizing

## Abstract

This SIP defines the standard header format for all Speclang files. Headers are language-aware, efficient to parse, and provide essential metadata for the reactive system.

## Motivation

Every file in Speclang needs metadata:
- Unique ID for references
- Version tracking
- Dependencies
- Ownership

Traditional approaches require parsing entire files to find metadata. Speclang headers are designed to be read in just 2 lines.

## Rationale

**Two-Line Declaration:**
- Line 1: Comment or blank (language-specific)
- Line 2: speclang-header with line count

This allows parsers and AI models to:
1. Read line 1-2 (2 tokens/contexts)
2. Extract line count N
3. Read exactly N lines for header
4. Understand file without loading content

**Language Awareness:**
Different languages use different comment syntax. Headers adapt while maintaining consistency.

## Specification

### Line 1

**Purpose:** Language-specific start

**Format:** Comment marker or blank line

**By Language:**

| Language | Line 1 |
|----------|--------|
| Markdown | `---` |
| YAML | `#` |
| Python | `#` |
| Go | `//` |
| Rust | `//` |
| TypeScript | `//` |
| Java | `//` |
| C/C++ | `//` |
| PHP | `//` |

**Examples:**
```markdown
---
```

```python
#
```

```go
//
```

### Line 2

**Purpose:** Declare header presence and size

**Format:** `<comment_prefix> speclang-header lines:N`

**By Language:**

| Language | Line 2 Format |
|----------|---------------|
| Markdown | `# speclang-header lines:N` |
| YAML | `# speclang-header lines:N` |
| Python | `# speclang-header lines:N` |
| Go | `// speclang-header lines:N` |

**Examples:**

Markdown/YAML:
```yaml
---
# speclang-header lines:12
```

Python:
```python
# speclang-header lines:10
```

Go:
```go
// speclang-header lines:10
```

### Lines 3 to N

**Purpose:** YAML frontmatter

**Format:** YAML with language-specific comment prefix (for code files)

**Required Fields:**

```yaml
id: "@domain/path"        # Unique identifier
version: "semver"         # Semantic version
```

**Optional Fields:**

```yaml
parent: "@ref:..."        # Parent spec
children:                 # Child specs
  - "@ref:..."
depends_on:               # Dependencies
  - "@ref:..."
refs:                     # Outgoing references
  - "@ref:..."
tags:                     # Categorization
  - "tag1"
  - "tag2"
short: "One line desc"    # Quick description
target: "go"              # Target language
status: "draft"           # draft | stable | deprecated
```

### Line N+1

**Purpose:** End of header marker

**Format:** `---` (for Markdown) or start of content (for code files)

**Examples:**

Markdown:
```markdown
---
# speclang-header lines:8
id: @specs/auth
version: 1.0.0
---
# Content here
```

Go:
```go
//
// speclang-header lines:10
// id: @generated/go/auth
// version: 1.0.0
//

package auth
```

## Header Parsing

### Algorithm

```
1. Read line 1
   - Store for comment style detection

2. Read line 2
   - Check for "speclang-header"
   - Extract line count N

3. Read lines 3 to N
   - For code files: strip comment prefix
   - Parse as YAML

4. Return Header object
```

### Performance

- **Context Usage:** 2 lines/tokens to start
- **Memory:** Only reads header, not content
- **Speed:** <1ms for header-only read
- **Scalability:** Works for files of any size

## Language-Specific Formats

### Markdown Specs (.spec.md)

```markdown
---
# speclang-header lines:10
id: @specs/auth
version: 1.0.0
refs:
  - @ref:specs/user
tags: [auth, security]
short: Authentication system
---

# Authentication

Content here...
```

### YAML Specs (.spec.yaml)

```yaml
# speclang-header lines:12
# id: @specs/auth/entities
# version: 1.0.0
# refs: [@ref:specs/auth]
# tags: [entities]
---

entities:
  User:
    fields:
      id: UUID
```

### Code Specs (.go.spec)

```go
//
// speclang-header lines:14
// id: @specs/auth/login.go.spec
// version: 1.0.0
// parent: @ref:specs/auth/login
// target: go
// refs: [@ref:specs/auth/entities]
//

package auth

func Login(...) {...}
```

## Validation

### Required Checks

1. **Line 1:** Must be comment or blank
2. **Line 2:** Must contain "speclang-header lines:N"
3. **N:** Must be integer >= 3
4. **id:** Must start with @, follow format
5. **version:** Must be valid semver

### Optional Checks

6. **refs:** All must be valid @ref format
7. **tags:** Should be lowercase
8. **short:** Should be <100 chars
9. **target:** Must be valid language

### Error Handling

**Invalid Header:**
- Block cascade
- Log error
- Notify agent
- Suggest fix

**Example Error:**
```
Error: Invalid header in specs/auth.spec.yaml
  Line 2: Expected "speclang-header lines:N"
  Found: "speclang-v1"
  Suggestion: Use format: "# speclang-header lines:10"
```

## Examples

### Minimal Header

```yaml
# speclang-header lines:3
id: @specs/minimal
version: 1.0.0
```

### Full Header

```yaml
# speclang-header lines:15
id: @specs/auth/login
version: 2.1.0
parent: @ref:specs/auth
children:
  - @ref:specs/auth/login/validation
  - @ref:specs/auth/login/rate-limit
depends_on:
  - @ref:specs/auth/entities
  - @ref:specs/auth/policies
refs:
  - @ref:stdlib/Result
  - @ref:stdlib/JWT
tags: [auth, login, jwt, rate-limit]
short: Login operation with JWT and rate limiting
target: go
status: stable
```

### Code File Header

```go
//
// speclang-header lines:12
// id: @generated/go/auth/login
// spec: @ref:specs/auth/login.go.spec
// northstar: @ref:northstar#auth
// version: 1.0.0
// generated_at: 2024-01-15T10:30:00Z
// generated_by: code-gen-go
// target: go
// refs: [@ref:specs/auth/entities]
//

package auth

func Login(email, password string) (*Token, error) {
    // implementation
}
```

## Backwards Compatibility

**Version 0 Files:**
- May use different header format
- Should be migrated
- Migration tool provided

## Security Implications

- Headers are parsed, not executed
- YAML parsing should be safe
- No code execution from headers

## Implementation

### Parser

```python
def parse_header(file_path):
    with open(file_path) as f:
        line1 = f.readline().strip()
        line2 = f.readline().strip()
        
        # Check format
        if "speclang-header" not in line2:
            raise InvalidHeaderError()
        
        # Extract line count
        match = re.search(r'lines:(\d+)', line2)
        if not match:
            raise InvalidHeaderError()
        
        n = int(match.group(1))
        
        # Read header content
        header_lines = []
        for _ in range(n - 2):
            header_lines.append(f.readline())
        
        # Parse YAML
        header = yaml.safe_load(''.join(header_lines))
        
        return Header(
            line_count=n,
            id=header['id'],
            version=header['version'],
            # ... other fields
        )
```

## References

- SIP 1: How to Write a SIP
- SIP 3: Block System
- SIP 4: Reference System
- YAML 1.2 Specification

## Copyright

This document is in the public domain.