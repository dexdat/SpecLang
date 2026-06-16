---
name: sip-001-how-to-write-sip-speclang-v0
title: "SIP 1: How to Write a SIP"
version: 0.1.0
description: Guide for writing Speclang Interface Protocol documents
category: documentation
---
# speclang-header lines:89
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 1: How to Write a SIP

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP explains how to write Speclang Interface Protocol (SIP) documents.

### Quick Start

1. **What is a SIP?** A design document for Speclang features
2. **SIP Types:** Informational, Standards Track, Process
3. **Naming:** `sip-XXX-name-speclang-vN.md`
4. **Format:** Frontmatter + Abstract + Motivation + Specification

### When to Read This

- **New contributors:** Learn SIP format before submitting
- **SIP authors:** Reference for structure and conventions
- **Reviewers:** Understand what makes a good SIP

### Writing Checklist

- [ ] Follow naming convention
- [ ] Include proper frontmatter
- [ ] Write clear Abstract
- [ ] Explain Motivation
- [ ] Provide Specification
- [ ] Include Examples
- [ ] Add References

### Related SIPs

- SIP 0: What is Speclang
- All other SIPs (they use this format)

## Abstract

This SIP describes the format and process for writing Speclang Interface Protocol (SIP) documents. SIPs are the canonical documentation for the Speclang language, system, and best practices.

## What is a SIP?

A SIP (Speclang Interface Protocol) is a design document that:
- Describes a feature, process, or convention
- Provides information to the community
- Documents design decisions
- Records architectural choices

SIPs are similar to PEPs (Python Enhancement Proposals) but for Speclang.

## SIP Types

### Informational
Describes a design issue or provides guidelines. Does not require implementation.

**Examples:**
- SIP 0: What is Speclang
- SIP 1: How to Write a SIP
- Best practices guides

### Standards Track
Describes a new feature or change that requires implementation.

**Examples:**
- SIP 2: Header Format
- SIP 3: Block System
- SIP 5: Agent Protocol

### Process
Describes a process surrounding Speclang.

**Examples:**
- Release process
- Contribution guidelines
- Review procedures

## SIP Format

All SIPs must follow this structure:

```markdown
---
name: sip-XXX-name-v0
title: "SIP XXX: Title"
version: 0.1.0
description: Brief description
category: documentation | standard | process
---

# SIP XXX: Title

**Status:** Draft | Proposed | Accepted | Rejected | Superseded  
**Version:** 0.1.0  
**Author:** Your Name

## Abstract

A short (~200 word) description of the technical issue being addressed.

## Motivation

Why is this SIP needed? What problem does it solve?

## Rationale

Why was this particular design chosen? What alternatives were considered?

## Specification

The technical specification. Should be detailed enough for implementation.

## Examples

Show examples of the feature/convention in practice.

## Backwards Compatibility

How does this affect existing specs/code?

## Security Implications

Are there security concerns? How are they addressed?

## Implementation

Notes on implementation (if applicable).

## References

Links to related SIPs, specs, or external resources.

## Copyright

This document is in the public domain.
```

## Header Format

Every SIP must have a YAML frontmatter header:

```yaml
---
name: sip-XXX-name-v0
title: "SIP XXX: Title"
version: 0.1.0
description: Brief description of this SIP
category: documentation | standard | process
---
```

**Fields:**
- `name`: sip-XXX-short-name-vN (follow convention)
- `title`: Full title with SIP number
- `version`: Start at 0.1.0, increment on revisions
- `description`: One sentence summary
- `category`: documentation, standard, or process

## Naming Convention

**Format:** `sip-<number>-<name>-speclang-v<version>`

**Examples:**
- sip-000-what-is-speclang-v0
- sip-001-how-to-write-sip-speclang-v0
- sip-002-header-format-speclang-v0
- sip-003-block-system-speclang-v0

**Rules:**
1. Number is sequential (000, 001, 002...)
2. Name is lowercase, hyphen-separated
3. Version starts at v0
4. File extension: `.md`
5. Location: `opencode/skills/`

## SIP Status

**Draft:**
- Initial state
- Author writing
- Not ready for review

**Proposed:**
- Ready for community review
- Discussion phase
- Open to feedback

**Accepted:**
- Review complete
- Approved for implementation
- May not be implemented yet

**Rejected:**
- Not accepted
- Reasons documented
- Archived

**Superseded:**
- Replaced by newer SIP
- Link to replacement
- Archived

## Writing Process

### 1. Idea
- Think of something missing
- Check existing SIPs (don't duplicate)
- Discuss with community

### 2. Draft
- Write initial version
- Use template above
- Keep it focused

### 3. Review
- Share for feedback
- Address comments
- Iterate

### 4. Number Assignment
- Get next available number
- Update filename
- Update title

### 5. Finalize
- Mark status
- Add version
- Sign off

## Content Guidelines

### Be Clear
- Use simple language
- Define terms
- Provide examples

### Be Complete
- Cover edge cases
- Address security
- Consider alternatives

### Be Concise
- Don't be wordy
- Every word matters
- Delete fluff

### Be Consistent
- Follow existing conventions
- Use same terminology
- Match style

## Examples

### Good SIP Abstract

```markdown
## Abstract

This SIP proposes a standard header format for all Speclang files. 
The header uses a two-line declaration system: line 1 is language-specific, 
line 2 declares header length. This allows parsers and models to read 
just 2 lines to understand file structure without loading entire content.

The format supports multiple languages (Go, Python, Markdown) while 
maintaining consistency. Headers are YAML-based for human readability 
and machine parsability.
```

### Good Specification

```markdown
## Specification

### Header Line 1

- Must be comment or blank
- Format depends on file type
- Examples:
  - Python: `#`
  - Go: `//`
  - Markdown: `---`

### Header Line 2

- Must contain "speclang-header"
- Must declare line count
- Format: `<comment> speclang-header lines:N`

### Header Content

- Lines 3 to N: YAML frontmatter
- Required fields: id, version
- Optional fields: refs, tags, etc.
```

## Common Mistakes

### ❌ Too Vague
"We should have headers."

### ✅ Specific
"Headers use a 2-line declaration: line 1 is comment/blank, line 2 declares length."

### ❌ Missing Examples
No examples provided.

### ✅ Complete Examples
Show before/after, edge cases, multiple languages.

### ❌ No Rationale
"Use YAML."

### ✅ With Rationale
"Use YAML because it's human-readable, machine-parsable, and supports complex nesting."

## Review Checklist

Before submitting a SIP:

- [ ] Follows naming convention
- [ ] Has proper header
- [ ] Abstract is clear
- [ ] Motivation explained
- [ ] Specification complete
- [ ] Examples provided
- [ ] Edge cases covered
- [ ] Security considered
- [ ] Backwards compatibility addressed
- [ ] References included
- [ ] Grammar/spelling checked

## SIP Lifecycle

```
Draft → Proposed → Accepted → Implemented → Active
   ↑        ↓          ↓
Rejected  Rejected  Superseded
```

## Updating SIPs

When updating an existing SIP:

1. Increment version: 0.1.0 → 0.2.0
2. Update filename: v0 → v1
3. Add "Changelog" section
4. Note what changed
5. Update status if needed

## References

- SIP 0: What is Speclang
- PEP 1: PEP Purpose and Guidelines (Python)
- RFC 2119: Key words for use in RFCs

## Copyright

This document is in the public domain.