# Speclang Skills

OpenCode skills for the Speclang system.

## SIPs (Speclang Interface Protocols)

SIPs are the canonical documentation for the Speclang language. Similar to PEPs for Python.

Each SIP includes a **README section** at the top with:
- Quick start guide
- Key concepts
- When to read
- Related SIPs

**Tip:** Start with the README section for a quick overview, then read the full SIP for details.

### Fundamental SIPs

| SIP | Title | Status |
|-----|-------|--------|
| [SIP 0](sip-000-what-is-speclang-v0.md) | What is Speclang | Draft |
| [SIP 1](sip-001-how-to-write-sip-v0.md) | How to Write a SIP | Draft |

### Language SIPs

| SIP | Title | Status |
|-----|-------|--------|
| [SIP 2](sip-002-header-format-speclang-v0.md) | Header Format | Draft |
| [SIP 3](sip-003-block-system-speclang-v0.md) | Block System | Draft |
| [SIP 4](sip-004-reference-system-speclang-v0.md) | Reference System | Draft |
| [SIP 5](sip-005-splitting-and-sizing-speclang-v0.md) | Splitting and Sizing | Draft |

### System SIPs

| SIP | Title | Status |
|-----|-------|--------|
| [SIP 6](sip-006-agent-protocol-speclang-v0.md) | Agent Protocol | Draft |
| [SIP 7](sip-007-cascade-system-speclang-v0.md) | Cascade System | Draft |
| [SIP 8](sip-008-configuration-speclang-v0.md) | Configuration | Draft |
| [SIP 9](sip-009-file-naming-speclang-v0.md) | File Naming | Draft |

## Agent Skills

Agent skills define how AI agents behave in the Speclang system.

### Core Agents

- **north-star** - Top-level orchestrator. Manages project.scl.
- **spec-writer** - Expands high-level specs.
- **code-gen** - Generates code specs.
- **test-writer** - Writes test specs.

### Support Agents

- **back-sync** - Syncs code edits back to specs.
- **adversarial-reviewer** - Reviews for edge cases.
- **recovery-agent** - Handles failures.
- **spec-validator** - Validates specs.

### Meta Agents

- **speclang-builder** - Builds Speclang using meta-circular development.

## Usage

### Loading Skills

```bash
# Install all skills
cp skills/*.md ~/.opencode/skills/

# Or in project
mkdir -p .opencode/skills/
cp skills/*.md .opencode/skills/
```

### Using SIPs

SIPs are documentation. Read them to understand:
- How headers work
- How blocks are structured
- How references link specs
- How the cascade system works

### Using Agents

Agents run automatically when files change:

```
File Change → Daemon → Router → Agent → Write → Commit
```

## File Organization

```
opencode/skills/
├── README.md                              # This file
├── sip-XXX-*.md                          # SIP documents (language spec)
└── [north-star|spec-writer|...].md       # Agent skills
```

## SIP Naming Convention

Format: `sip-<number>-<name>-speclang-v<version>`

Examples:
- `sip-000-what-is-speclang-v0`
- `sip-002-header-format-speclang-v0`
- `sip-006-agent-protocol-speclang-v0`

## Agent Skill Structure

```yaml
---
name: agent-name
version: 0.1.0
description: What this agent does
trigger: When it runs
permissions: [read, write]
owns: files/**/*.pattern
subagent: true
---

# Agent documentation...
```

## Quick Reference

### Headers
```yaml
# speclang-header lines:12
id: @specs/auth
version: 1.0.0
refs: [@ref:specs/user]
---
```

### Blocks
```markdown
# @block:auth/login @kind:operation
login(email: String, password: String) -> Result<Token, Error>:
  ...
```

### References
```
@ref:specs/auth#login
@ref:specs/auth/entities#User
```

### Splitting
```
auth.spec.yaml (index)
auth.spec.dir/
  ├── entities.spec.yaml
  ├── operations.spec.yaml
  └── tests.spec.yaml
```

## Integration

Skills work with:
- **OpenCode** - As subagents
- **SQLite** - Database queries
- **Git** - Per-file commits
- **MCP** - Tool access
- **Daemon** - File watching

## References

- SIP 0: What is Speclang (start here)
- SIP 1: How to Write a SIP
- See individual SIPs for details