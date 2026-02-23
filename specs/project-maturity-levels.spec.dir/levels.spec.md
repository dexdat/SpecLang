# speclang-header lines:11
id: "@speclang/project-maturity-levels/levels"
version: 0.1.0
layer: 2
tags: [project, maturity, levels, definitions]
parent: "@ref:specs/project-maturity-levels"
part: 1/2
project_level: Alpha
agent_support: agent_autonomous
short: Definitions for each project_level value
---
# Project Maturity Level Definitions

Clear definitions for the `project_level` field (POC → Enterprise).

## Overview

```speclang
# @block:project-level/overview @kind:note
The `project_level` field indicates the maturity stage of a project.
It guides agent behavior, validation strictness, and deployment readiness.

Levels are ordered from least mature (POC) to most mature (Enterprise).
Each level has specific criteria for spec completeness, testing,
documentation, and operational readiness.

Agents use project_level to:
- Determine required validation rigor
- Adjust autonomy level (more human oversight at lower levels)
- Allocate resources appropriately
- Decide deployment strategies
```

## Level Definitions

```speclang
# @block:project-level/definitions @kind:table
| Level | Name | Description | Criteria | Agent Behavior |
|-------|------|-------------|----------|----------------|
| POC | Proof of Concept | Experimental, minimal validation | - Core idea validated<br>- No production deployment<br>- Minimal tests<br>- Documentation sparse | Human confirmation required for each step |
| MVP | Minimum Viable Product | Core functionality validated | - Core features work<br>- Early adopters can use<br>- Basic tests exist<br>- Documentation usable | Agent-assisted with human review |
| Alpha | Internal Testing | Incomplete features, internal use | - Feature incomplete but progressing<br>- Internal testing only<br>- Test coverage growing<br>- Documentation improving | Agent-assisted, human reviews major changes |
| Beta | External Testing | Feature complete, stability focus | - All features implemented<br>- External testing (beta users)<br>- Comprehensive tests<br>- Documentation complete | Agent-autonomous for non-critical changes |
| Production | Stable Production | Production-ready, supported | - Stable, reliable<br>- Production deployment<br>- Full test suite<br>- Complete documentation | Fully autonomous, human only for emergencies |
| Startup | Small Team Scale | Rapid iteration, limited resources | - Small team (<10)<br>- Fast iteration cycles<br>- Lean processes<br>- Focus on growth | Autonomous with rapid feedback loops |
| SMB | Small/Medium Business | Established processes, moderate scale | - Established team (10-100)<br>- Defined processes<br>- Compliance beginnings<br>- Moderate scale | Autonomous with compliance checks |
| MSB | Medium/Large Business | Complex integration, compliance focus | - Large team (100-1000)<br>- Complex integrations<br>- Strict compliance<br>- Enterprise features | Autonomous with strict governance |
| Enterprise | Maximum Scale | Strict governance, high availability | - Very large team (1000+)<br>- Global scale<br>- Maximum compliance<br>- Highest availability | Fully autonomous with extensive monitoring |
```