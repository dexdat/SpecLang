---
id: "@speclang/spec-format"
version: 0.1.0
layer: 0
project_level: Alpha
agent_support: agent_autonomous
tags: [format, syntax, self-describing, file-types]
status: draft
children:
  - "@ref:specs/spec-format.spec.dir/structure"
  - "@ref:specs/spec-format.spec.dir/blocks"

short: Spec Format (3 file types + block kinds)
---

# Spec Format

The format you're reading. Self-describing. Rigid header, flexible body.

This spec has been split into sub-specs. See spec-format.spec.dir/ for details.

## Three File Types

SpecLang defines three file types based on extension order:

| Extension Order | Type | Description | Code Pair |
|-----------------|------|-------------|-----------|
| `{name}.spec.md` | Informational Spec | Describes concepts, architecture, design. No code pair. | No |
| `{name}.spec.{lang}.md` | Code-Pair Spec | Design doc for a specific code file in language {lang}. Has a 1:1 pair with generated code. | Yes — 1:1 with `.spec.{lang}` |
| `{name}.spec.{lang}` | Generated Code | Actual implementation in language {lang}. Written by the model from the code-pair spec + all refs + folder context. | Yes — generated from `.spec.{lang}.md` |

### Extension Rules

1. **Informational Spec** (`{name}.spec.md`): Pure documentation. No `target_lang`, `output`, or `owned-by` header fields. Lives in the folder hierarchy.
2. **Code-Pair Spec** (`{name}.spec.{lang}.md`): Requires `target_lang`, `output`, and `owned-by` in the header. Produces one output file.
3. **Generated Code** (`{name}.spec.{lang}`): Never hand-edited. Written exclusively by the assembler (codegen agent) from the paired `.spec.{lang}.md` spec.

## Block Kinds

The `@kind:` field in block definitions supports these values:

| @kind Value | Description |
|-------------|-------------|
| `@kind:entity` | Entity definition — describes a data structure or concept |
| `@kind:operation` | Operation or process — describes an action or workflow |
| `@kind:code` | Code block — contains executable code in the target language |
| `@kind:requirement` | Requirement — describes a functional or non-functional requirement |
| `@kind:diagram` | Diagram — Mermaid or other diagram format |
| `@kind:refs` | References — list of `@ref:` links to other specs |
| `@kind:protocol` | Protocol — describes a communication or coordination protocol |
| `@kind:tool` | Tool definition — describes a tool interface |
| `@kind:note` | Note — informational note or example |

See @ref:specs/spec-format.spec.dir/blocks for detailed block format rules.
