# speclang-header lines:13
id: "@speclang/external-methodologies/recommendations"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [bmad, recommendations, adoption, patterns]
parent: "@ref:specs/external-methodologies"
part: "2/3"
siblings:
  prev: "@ref:specs/external-methodologies.spec.dir/bmad-comparison"
next: "@ref:specs/external-methodologies.spec.dir/adoption-patterns"short: Recommendations - What to adopt from BMAD
---

# Recommendations: BMAD Patterns for SpecLang

Specific recommendations for adopting patterns from BMAD into SpecLang. Based on comparative analysis of both frameworks.

## Executive Summary

**Do NOT adopt BMAD wholesale** – SpecLang and BMAD serve different purposes:
- SpecLang: Specification *language* and format
- BMAD: Development *methodology* and workflow

**DO adopt selected patterns** that enhance SpecLang without compromising its core philosophy.

## What NOT to Adopt

### @rec/avoid

**1. Agent-as-Primary Model**
- **Why not**: SpecLang specs are source of truth, not agent outputs
- **Instead**: Keep `agent_support` field to guide agent behavior

**2. Template-Driven Document Generation**
- **Why not**: SpecLang specs are self-describing, not generated from templates
- **Instead**: Use spec body patterns and block conventions

**3. Implicit Dependencies via Workflow Phases**
- **Why not**: SpecLang requires explicit `@ref:` dependencies
- **Instead**: Maintain spanning tree with explicit refs

**4. YAML-to-Markdown Compilation**
- **Why not**: SpecLang uses native YAML frontmatter + markdown
- **Instead**: Direct `.spec.md` files without compilation step

**5. Fixed Four-Phase Workflow**
- **Why not**: SpecLang uses flexible spanning tree, not rigid phases
- **Instead**: Layer system accommodates any workflow structure

## What to Adopt

### @rec/adopt-validation

**1. Validation Depth Requirements**
- **From BMAD**: `tools/schema/agent.js` validation
- **To SpecLang**: Enhance `@ref:speclang/autonomous-validation`

**Adoption**:
```yaml
# In autonomous-validation.spec.md
validation_rules:
  agent_autonomous:
    required_depth:
      - step_by_step_descriptions: true
      - resolved_references: true
      - explicit_semantics: true
      - complete_metadata: true
```

**Status**: Adopted in @ref:specs/autonomous-validation

### @rec/adopt-templates

**2. Content Templates for Common Spec Types**
- **From BMAD**: Template system for PRD, architecture docs
- **To SpecLang**: Standard body patterns for common specs

**Adoption**:
Create template specs for:
- API specs (see @ref:specs/api)
- Component specs (see @ref:specs/core)
- Test specs (see @ref:specs/test-specs)
- Validation specs (see @ref:specs/validation)

**Implementation**:
```markdown
# Template: API Spec

## @template/api/overview
Purpose, scope, version info

## @template/api/endpoints
Endpoint definitions with @ref blocks

## @template/api/schemas
Data models and types

## @template/api/errors
Error handling specification
```

**Status**: Partially implemented, needs expansion

### @rec/adopt-behavior-matrix

**3. Agent Behavior Matrix**
- **From BMAD**: Scale-adaptive intelligence based on project level
- **To SpecLang**: `@ref:speclang/agent-behavior-matrix`

**Adoption**:
Already implemented in @ref:specs/agent-behavior-matrix.spec.md:
```yaml
# speclang-header
id: "@speclang/agent-behavior-matrix"
```

**Status**: Already adopted

### @rec/adopt-ide-integration

**4. IDE Integration Patterns**
- **From BMAD**: Compiled agents for Codex, Cursor, Windsurf
- **To SpecLang**: `@ref:speclang/opencode-plugin`

**Adoption**:
Already implemented in @ref:specs/opencode-plugin.spec.md with:
- IDE-specific command files
- Agent activation blocks
- Context engineering patterns

**Status**: Already adopted

### @rec/adopt-validation-tooling

**5. Validation Tooling**
- **From BMAD**: Schema validation, linting tools
- **To SpecLang**: `@ref:speclang/validation-tool`

**Adoption**:
Already implemented:
- `@ref:speclang/validation-tool` – Validation tool spec
- `@ref:speclang/speclang_parser` – Parser with validation
- Header validation in @ref:specs/headers

**Status**: Already adopted

## What to Consider

### @rec/consider

**1. BMAD's "Party Mode" Multi-Agent Collaboration**
- **Idea**: Multiple agents collaborating on complex specs
- **Consider for**: @ref:speclang/cascade-protocol
- **Open question**: How to map to SpecLang's spanning tree?

**2. BMAD's Sidecar System**
- **Idea**: Agent-specific knowledge directories
- **Consider for**: @ref:speclang/skills
- **Open question**: How to integrate with existing skills system?

**3. BMAD's TEA (Test Architect) System**
- **Idea**: Specialized test generation agent
- **Consider for**: @ref:speclang/test-specs
- **Open question**: How to enhance existing test spec format?

## Implementation Priority

### @rec/priority

```speclang
# @block:rec/priority @kind:table
| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Validation depth requirements | Low | High |
| P0 | Agent behavior matrix | Done | High |
| P1 | Content templates | Medium | Medium |
| P1 | IDE integration | Done | High |
| P2 | Party mode collaboration | High | Medium |
| P2 | Sidecar system | Medium | Low |
| P3 | TEA integration | High | Medium |
```

## Migration Path

### @rec/migration

For projects using BMAD wanting to adopt SpecLang:

1. **Phase 1**: Map BMAD artifacts to SpecLang specs
   - PRD.md → `features.spec.md`
   - Architecture.md → `component.spec.md`
   - Tests → `test-specs.spec.md`

2. **Phase 2**: Add SpecLang headers to existing docs
   - Add `speclang-header` frontmatter
   - Define `id`, `version`, `layer`

3. **Phase 3**: Replace implicit dependencies with `@ref:`
   - Add explicit references between specs
   - Build spanning tree

4. **Phase 4**: Maintain BMAD workflow, use SpecLang format
   - Continue BMAD four-phase approach
   - Output SpecLang specs instead of free-form markdown

See @ref:specs/external-methodologies/adoption-patterns for detailed mapping.
