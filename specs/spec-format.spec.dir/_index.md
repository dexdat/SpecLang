# speclang-header lines:10
id: "@specs/spec-format-dir/index"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [spec-format, index, directory]
short: "Spec Format Directory Index - Spec file format sub-specs"
status: active
---

# Spec Format Directory Index

**Directory:** `specs/spec-format.dir/`  
**Parent:** `spec-format.spec.md` (main index spec)

## Contents

This directory contains sub-specs defining the SpecLang file format - the format you're reading right now.

### Files

1. **`structure.spec.md`** - Spec Format: Structure
   - File structure, file types, directory conventions
   - Layer: 2, Part: 1/2
   - Siblings: next → `blocks.spec.md`

2. **`blocks.spec.md`** - Spec Format: Blocks
   - Block syntax, kinds, content types
   - Layer: 2, Part: 2/2
   - Siblings: prev → `structure.spec.md`

## Reading Order

For understanding SpecLang file format:

1. **Start with parent:** `../spec-format.spec.md` (main index)
2. **Then read:** `structure.spec.md` (file structure)
3. **Then read:** `blocks.spec.md` (block syntax)

## Key Concepts

### From `structure.spec.md`:
- **File parts**: Header, divider (`---`), blocks
- **File types**: `.spec.md`, `.spec.yaml`, `.scl`
- **Directory conventions**: `.spec.dir/` for sub-specs
- **Index specs**: Parent files with `children:` field
- **Sub-specs**: Files with `parent:` field

### From `blocks.spec.md`:
- **Block syntax**: `# @block:{id} @kind:{kind}`
- **Block kinds**: entity, operation, policy, test, diagram, code, note, etc.
- **Content types**: prose, code fences, speclang code blocks
- **ID format**: `domain/path/name` (no spaces, use hyphens)

## Dependencies

Both files:
- Reference parent: @ref:specs/spec-format
- Reference each other via `siblings.prev` and `siblings.next`
- Are referenced by `headers.spec.md` for implementation

## Purpose

The Spec Format directory defines:
- **How spec files are structured** (headers, blocks)
- **What syntax is valid** (block format, kinds)
- **How specs reference each other** (`@ref:` syntax)
- **How specs are organized** (directories, sub-specs)

This is **meta-circular**: These specs define the format that these specs are written in.

## Notes

- These specs are **self-describing**: They use the format they define
- **Layer 2**: Implementation details of layer 0 format concepts
- **Required reading**: For any agent writing or parsing specs
- **Reference often**: When confused about spec syntax, check here

For the complete format definition, read `../spec-format.spec.md` first, then these sub-specs in order.