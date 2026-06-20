# speclang-header lines:13
id: "@speclang/external-methodologies/bmad-comparison"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [bmad, comparison, methodology, analysis]
parent: "@ref:specs/external-methodologies"
part: "1/3"
siblings:
  prev: null
  next: "@ref:specs/external-methodologies.spec.dir/recommendations"
short: BMAD Comparison - Detailed analysis of BMAD vs SpecLang
---

# BMAD Comparison

Detailed comparison between SpecLang and BMAD (Breakthrough Method for Agile AI-Driven Development).

## BMAD Overview

BMAD is an AI-driven development framework that provides:
- **Four-phase methodology**: Analysis → Planning → Solutioning → Implementation
- **Agent-centric architecture**: Agents are primary; specs are outputs
- **Template-driven documents**: PRD.md, architecture.md generated from templates
- **Tri-modal workflow pattern**: Create → Validate → Edit
- **YAML-based agent definitions**: `.agent.yaml` files compiled to markdown

## Philosophy Comparison

### @bmad/philosophy-comparison

```speclang
# @block:bmad/philosophy-comparison @kind:table
| Aspect | SpecLang | BMAD |
|--------|----------|------|
| Core Identity | Specification language | Development methodology |
| Source of Truth | Self-describing specs | Agent-generated artifacts |
| Primary Actor | Specs guide agents | Agents generate specs |
| Structure | Rigid headers, flexible bodies | Workflow-driven, template-based |
| Dependencies | Explicit `@ref:` spanning tree | Implicit via workflow phases |
| Scope | Language/tooling specification | Full development lifecycle |
| Agent Role | `agent_support` field guides behavior | Agents are primary entities |
```

## Format Comparison

### @bmad/format-comparison

```speclang
# @block:bmad/format-comparison @kind:table
| Feature | SpecLang | BMAD |
|---------|----------|------|
| **Header Format** | YAML frontmatter with `speclang-header` | YAML frontmatter in `.agent.yaml` |
| **Content Format** | Flexible markdown blocks | Template-driven markdown |
| **File Extension** | `.spec.md`, `.scl`, `.spec.yaml` | `.agent.yaml` → compiled `.md` |
| **References** | `@ref:path/to/spec#block` | Workflow phase implicit refs |
| **Splitting** | `.spec.dir/` sub-specs | Workflow step outputs |
| **Validation** | `@ref:speclang/autonomous-validation` | `tools/schema/agent.js` schema validation |
| **Compilation** | Parse and execute | YAML → Markdown with XML injection |
```

## Architecture Comparison

### @bmad/architecture-comparison

**SpecLang Architecture**:
- Spanning tree with explicit dependencies
- Layer field indicates relative depth
- Root: `project.scl` (layer 0)
- Leaves: Implementation specs (deepest layers)
- Self-expanding as agents create new specs

**BMAD Architecture**:
- Four-phase workflow system
- Agents organized by role (BA, PM, Architect, Dev, QA)
- Workflow execution engine with `workflow.xml`
- Module system for extending capabilities

### @bmad/layer-mapping

```speclang
# @block:bmad/layer-mapping @kind:table
| SpecLang Layer | BMAD Phase | BMAD Artifact |
|----------------|------------|---------------|
| 0 (Root) | Analysis | Product brief, research |
| 1-2 (Features) | Planning | PRD.md |
| 3-4 (Components) | Solutioning | Architecture.md |
| 5+ (Implementation) | Implementation | Code, tests |
| 7-9 (Tests) | Testing | TEA test artifacts |
```

## Agent System Comparison

### @bmad/agent-comparison

**SpecLang Agents**:
- Defined by `agent_support` field in spec headers
- Three levels: `human_only`, `agent_assisted`, `agent_autonomous`
- Agents read specs to understand what to do
- Specs are the source of truth

**BMAD Agents**:
- Defined in `.agent.yaml` files with personas
- 26+ specialized agents (BA, PM, Architect, Dev, QA, etc.)
- Agents generate specs from templates
- Workflows orchestrate agent collaboration

### @bmad/agent-behavior-matrix

```speclang
# @block:bmad/agent-behavior-matrix @kind:table
| Scenario | SpecLang Behavior | BMAD Behavior |
|----------|-------------------|---------------|
| POC + human_only | Require human confirmation per step | BA agent with high oversight |
| Production + agent_autonomous | Full autonomous generation | Full agent-driven workflow |
| Mixed maturity | Handle dependencies appropriately | Phase-gate progression |
```

## Strengths Comparison

### @bmad/strengths-spec

**SpecLang Strengths**:
1. **Machine-parseable**: Rigid YAML headers for tooling
2. **Human-readable**: Markdown bodies for developers
3. **Self-describing**: Specs reference themselves and each other
4. **Explicit dependencies**: `@ref:` syntax prevents ambiguity
5. **Spanning tree**: Clear dependency hierarchy
6. **Autonomous-ready**: `agent_autonomous` specs have required depth

### @bmad/strengths-bmad

**BMAD Strengths**:
1. **Workflow guidance**: Clear four-phase methodology
2. **Agent specialization**: Role-specific agents (26+ types)
3. **Template system**: Consistent document generation
4. **IDE integration**: Compiled agents for Codex, Cursor, Windsurf
5. **Mature tooling**: Validation, compilation, execution engine
6. **Community**: Active development, extensive documentation

## When to Use Which

### @bmad/use-cases

```speclang
# @block:bmad/use-cases @kind:table
| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Define spec format | SpecLang | Self-describing, language-focused |
| AI agent workflows | BMAD | Mature agent system |
| Document standards | SpecLang | Explicit, referenceable |
| Development methodology | BMAD | Complete four-phase system |
| IDE plugin specs | SpecLang | See @ref:specs/opencode-plugin |
| Code generation | Both | SpecLang format + BMAD workflow |
```

## Integration Possibilities

### @bmad/integration

SpecLang and BMAD can coexist:
- **SpecLang as format**: BMAD agents could output SpecLang specs
- **BMAD as methodology**: SpecLang projects could follow BMAD phases
- **Complementary**: SpecLang defines *how* to write specs; BMAD defines *what* to write when

### @bmad/hybrid-approach

**Recommended Hybrid**:
1. Use BMAD's four-phase methodology for project workflow
2. Use SpecLang format for all specifications
3. Map BMAD artifacts (PRD, architecture) to SpecLang specs
4. Use SpecLang's `@ref:` system for explicit dependencies

See @ref:specs/external-methodologies/adoption-patterns for detailed mapping.
