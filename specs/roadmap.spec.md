# speclang-header lines:19
id: "@speclang/roadmap"
version: 1.0.0
layer: 0
target: specs/roadmap.spec.dir/
short: "SpecLang development roadmap from POC to Production"
project_level: Alpha
agent_support: agent_autonomous
tags: [roadmap, planning, phases, milestones]
children: 
    - "@ref:specs/roadmap.spec.dir/poc"
    - "@ref:specs/roadmap.spec.dir/mvp"
    - "@ref:specs/roadmap.spec.dir/alpha"
    - "@ref:specs/roadmap.spec.dir/beta"
    - "@ref:specs/roadmap.spec.dir/production"

# SpecLang Development Roadmap

---

## Overview

SpecLang development follows a maturity progression:

```
POC → MVP → Alpha → Beta → Production
```

Each phase has:
- **Clear deliverables** - What must work
- **Success criteria** - How we know it's done
- **Estimated timeline** - When we target completion
- **Dependencies** - What must be complete first

## Phase Summary

| Phase | Focus | Timeline | Critical Path |
|-------|-------|----------|---------------|
| **POC** | File watcher → cascade → code gen | 2-3 weeks | Daemon + cascade |
| **MVP** | Multi-agent coordination | 3-4 weeks | Agent system + routing |
| **Alpha** | End-to-end workflow | 4-6 weeks | Pipeline + validation |
| **Beta** | Stability + performance | 6-8 weeks | Testing + optimization |
| **Production** | Enterprise features | 8-12 weeks | Security + monitoring |

## Reading This Roadmap

Each phase document contains:
- **User Stories** - What users can do
- **Technical Requirements** - What must be built
- **Acceptance Criteria** - How we verify completion
- **Blockers & Risks** - What could go wrong
- **Success Metrics** - Measurable outcomes

## Current Status

**In Progress**: POC Phase
**Next Milestone**: Working file watcher + cascade
**Target Date**: TBD

---

*This roadmap is a living document. Update as priorities shift.*
