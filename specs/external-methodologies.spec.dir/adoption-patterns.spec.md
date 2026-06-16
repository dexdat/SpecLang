# speclang-header lines:13
id: "@speclang/external-methodologies/adoption-patterns"
version: 0.1.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [bmad, patterns, adoption, mapping, workflow]
parent: ""@ref:specs/external-methodologies"part: "3/3"
siblings:
  prev: ""@ref:specs/external-methodologies.spec.dir/recommendations"  next: null
short: Adoption Patterns - How to map BMAD concepts to SpecLang
---

# Adoption Patterns

How to map concepts from BMAD (and other methodologies) to SpecLang. Practical patterns for hybrid usage.

## Overview

This spec provides concrete patterns for:
1. Mapping BMAD artifacts to SpecLang specs
2. Following BMAD workflows while using SpecLang format
3. Converting between BMAD and SpecLang representations

## BMAD Artifact Mapping

### @patterns/artifact-mapping

**Mapping BMAD artifacts to SpecLang specs**:

```speclang
# @block:patterns/artifact-mapping @kind:table
| BMAD Artifact | SpecLang Equivalent | File Pattern | Layer |
|----------------|---------------------|--------------|-------|
| Product Brief | Project spec | `project.scl` | 0 |
| Research Notes | Research spec | `research.spec.md` | 1 |
| PRD (Product Requirements Doc) | Feature specs | `features.spec.md` | 1-2 |
| Architecture Document | Component specs | `*.spec.md` (component level) | 2-3 |
| Technical Design | Implementation specs | `*.spec.md` (implementation) | 3-4 |
| Code | Code specs | `*.go.spec`, `*.ts.spec` | 4-5 |
| Tests (TEA artifacts) | Test specs | `*.test.spec.md` | 7-8 |
| Sprint Status | Cascade tracking | `cascade.spec.md` | N/A |
```

## BMAD Phase Mapping

### @patterns/phase-mapping

**Mapping BMAD's four phases to SpecLang layers**:

### @patterns/phase-analysis

**BMAD Analysis Phase → SpecLang Layers 0-1**

BMAD activities:
- Product brief creation
- Market research
- Stakeholder interviews

SpecLang representation:
```yaml
# speclang-header lines:12
id: "@project/product-brief"
version: 1.0.0
layer: 0
project_level: POC
agent_support: agent_assisted
tags: [product, brief, requirements]
short: Product brief and initial requirements
---

# Product Brief

## @brief/overview
One-line goal statement

## @brief/problem
Problem being solved

## @brief/solution
Proposed solution approach

## @ref:speclang/project-maturity-levels
See @ref:speclang/project-maturity-levels for POC requirements.
```

### @patterns/phase-planning

**BMAD Planning Phase → SpecLang Layers 1-2**

BMAD activities:
- PRD creation
- Feature breakdown
- User stories

SpecLang representation:
```yaml
# speclang-header lines:13
id: "@project/features"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [features, requirements, prd]
depends_on:
  - ""@ref:project/product-brief"children:
  - ""@ref:project/features.spec.dir/auth"  - ""@ref:project/features.spec.dir/api"short: Feature specifications (PRD equivalent)
---

# Features

## @features/overview
Feature list derived from product brief @ref:project/product-brief.

## @features/auth
Authentication feature
- Depends on: @ref:project/features.spec.dir/auth

## @features/api
API feature
- Depends on: @ref:project/features.spec.dir/api
```

### @patterns/phase-solutioning

**BMAD Solutioning Phase → SpecLang Layers 2-4**

BMAD activities:
- Architecture design
- Technical decisions
- Component breakdown

SpecLang representation:
```yaml
# speclang-header lines:14
id: "@project/features/auth"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [auth, component, architecture]
parent: ""@ref:project/features"depends_on:
  - ""@ref:project/features"children:
  - ""@ref:project/features.spec.dir/auth.spec.dir/entities"  - ""@ref:project/features.spec.dir/auth.spec.dir/operations"short: Authentication component architecture
---

# Authentication Component

## @auth/architecture
System architecture following @ref:speclang/layer-definitions.

## @auth/entities
See @ref:project/features.spec.dir/auth.spec.dir/entities

## @auth/operations
See @ref:project/features.spec.dir/auth.spec.dir/operations

## @auth/tech-stack
Technical decisions:
- Database: SQLite (@ref:specs/sqlite)
- Protocol: OAuth 2.0 (@ref:specs/auth)
```

### @patterns/phase-implementation

**BMAD Implementation Phase → SpecLang Layers 4-6**

BMAD activities:
- Code generation
- Testing
- Deployment

SpecLang representation:
```yaml
# speclang-header lines:12
id: "@project/auth/login-go"
version: 1.0.0
layer: 4
project_level: Alpha
agent_support: agent_autonomous
tags: [auth, login, go, implementation]
parent: ""@ref:project/features/auth"short: Login implementation in Go
---

# Login Implementation (Go)

## @login-go/spec
Maps to Go code following @ref:specs/go.

```speclang
# @block:login-go/handler @kind:code
func HandleLogin(req LoginRequest) (*Session, error) {
    // Validate credentials
    // Create session
    // Return session token
}
```

## @login-go/tests
See @ref:project/auth/login-go.test.spec
```

## Agent Role Mapping

### @patterns/agent-mapping

**Mapping BMAD agents to SpecLang agent support levels**:

```speclang
# @block:patterns/agent-mapping @kind:table
| BMAD Agent | SpecLang Role | agent_support |
|------------|---------------|---------------|
| Business Analyst (BA) | Spec-Writer | agent_assisted |
| Product Manager (PM) | Spec-Writer | agent_assisted |
| Architect | Spec-Writer | agent_autonomous |
| Developer | Code-Gen | agent_autonomous |
| QA | Test-Writer | agent_autonomous |
| Test Architect (TEA) | Test-Writer | agent_autonomous |
| Game Architect (BMGD) | Spec-Writer | agent_autonomous |
| Performance Engineer | Spec-Writer | agent_autonomous |
```

## Workflow Pattern Mapping

### @patterns/workflow-tri-modal

**BMAD Tri-Modal: Create → Validate → Edit**

In SpecLang:
```yaml
# speclang-header lines:13
id: "@project/workflow-example"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [workflow, tri-modal, example]
short: Example of tri-modal pattern in SpecLang
status: draft  # Create phase
---

# Workflow Example

## @workflow/create
Initial draft with `status: draft`

## @workflow/validate
Run validation: `speclang validate @project/workflow-example`
- Check: All @refs resolve
- Check: Required fields present
- Check: Autonomous depth requirements

## @workflow/edit
After validation passes:
- Update `status: stable`
- Add `change_id` with commit hash
- Update `version` per semver
```

### @patterns/workflow-party-mode

**BMAD "Party Mode" Multi-Agent Collaboration**

In SpecLang (cascade protocol):
```yaml
# speclang-header lines:14
id: "@project/cascade-example"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [cascade, party-mode, multi-agent]
depends_on:
  - ""@ref:project/features"caused_by: "@commit:abc123"  # Trigger commit
part_of: "@cascade:20250222-001"
short: Multi-agent collaboration example
---

# Cascade Example

## @cascade/participants
Multiple specs created concurrently:
- @ref:project/features.spec.dir/auth (Architect agent)
- @ref:project/features.spec.dir/api (Architect agent)
- @ref:project/features.spec.dir/ui (Designer agent)

## @cascade/convergence
All specs reference common parent @ref:project/features.
Cascade converges when all children have `status: stable`.

See @ref:speclang/cascade-protocol for details.
```

## Template Pattern Mapping

### @patterns/template-prd

**BMAD PRD Template → SpecLang Feature Spec**

BMAD PRD structure:
```markdown
# Product Requirements Document

## Executive Summary
## Problem Statement
## Solution Overview
## Features
## User Stories
## Acceptance Criteria
## Non-Functional Requirements
```

SpecLang equivalent:
```yaml
# speclang-header lines:12
id: "@project/prd"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [prd, features, requirements]
short: Product requirements in SpecLang format
---

# Product Requirements

## @prd/summary
One-line summary

## @prd/problem @kind:table
| Aspect | Description |
|--------|-------------|
| Problem | ... |
| Impact | ... |

## @prd/solution
Solution approach

## @prd/features
Feature list with @ref blocks

## @prd/stories
User stories as @kind:entity blocks

## @prd/criteria
Acceptance criteria as @kind:checklist

## @prd/nfrs
Non-functional requirements
```

### @patterns/template-architecture

**BMAD Architecture Document → SpecLang Component Spec**

BMAD Architecture structure:
```markdown
# Architecture Document

## System Overview
## Component Diagram
## Data Flow
## API Specifications
## Technology Stack
## Security Considerations
## Deployment Architecture
```

SpecLang equivalent:
```yaml
# speclang-header lines:12
id: "@project/architecture"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [architecture, components]
short: System architecture specification
---

# Architecture

## @arch/overview
System overview

## @arch/components @kind:diagram
Component relationships

## @arch/data-flow @kind:diagram
Data flow diagrams

## @arch/api
API specs:
- @ref:project/api/endpoints

## @arch/tech-stack @kind:table
| Component | Technology | @ref |
|-----------|------------|------|
| Database | SQLite | @ref:specs/sqlite |

## @arch/security
Security specifications

## @arch/deployment
Deployment specs
```

## Validation Pattern Mapping

### @patterns/validation-bmad-to-speclang

**BMAD Validation → SpecLang Validation**

BMAD approach:
- Schema validation via `tools/schema/agent.js`
- Agent compilation validation
- Workflow execution validation

SpecLang approach:
```yaml
# Validation in @ref:speclang/validation-tool

validation_rules:
  header:
    required: [id, version]
    format: YAML frontmatter with speclang-header
  
  references:
    must_resolve: true
    syntax: ""@ref:path/to/spec#block"  
  autonomous_depth:
    required_for: agent_autonomous
    checks:
      - step_by_step_descriptions
      - resolved_references
      - explicit_semantics
      - complete_metadata
```

## Hybrid Workflow Example

### @patterns/hybrid-example

**Complete example: BMAD workflow with SpecLang specs**

```bash
# Phase 1: Analysis (BMAD)
# Agent: Business Analyst
# Output: project.scl (SpecLang)

$ speclang create project.scl \
  --layer 0 \
  --project-level POC \
  --agent-support agent_assisted

# Phase 2: Planning (BMAD)
# Agent: Product Manager
# Output: features.spec.md (SpecLang)

$ speclang create specs/features.spec.md \
  --layer 1 \
  --depends-on project.scl \
  --project-level Alpha \
  --agent-support agent_autonomous

# Phase 3: Solutioning (BMAD)
# Agent: Architect
# Output: component specs (SpecLang)

$ speclang create specs/features.spec.dir/ \
  --layer 2 \
  --parent specs/features.spec.md

# Phase 4: Implementation (BMAD)
# Agent: Developer
# Output: code specs (SpecLang)

$ speclang create specs/auth/login.go.spec \
  --layer 4 \
  --parent specs/features/auth.spec.md

# Validation (SpecLang)
$ speclang validate specs/
$ speclang generate-index
```

## Summary

### @patterns/summary

**Key Takeaway**: Use BMAD for *workflow guidance* (what to do when), use SpecLang for *specification format* (how to write it down).

**Benefits of Hybrid Approach**:
1. Clear methodology from BMAD's four-phase system
2. Machine-parseable specs from SpecLang
3. Explicit dependencies via SpecLang `@ref:`
4. Autonomous agent support via SpecLang headers
5. Best of both worlds: guidance + precision

**See Also**:
- @ref:speclang/external-methodologies/bmad-comparison for detailed comparison
- @ref:speclang/external-methodologies/recommendations for adoption recommendations
