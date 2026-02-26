# speclang-header lines:18
id: "@speclang/roadmap/poc"
parent: "@ref:specs/roadmap"
version: 1.0.0
layer: 1
target: specs/roadmap.spec.dir/poc.spec.dir/
short: "POC phase: File watcher to code generation"
project_level: POC
agent_support: agent_assisted
tags: [roadmap, poc, phase-1, daemon, cascade]
children:
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/types"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/database"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/tests"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/poc-daemon"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/simple-agent"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/file-watcher"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/event-routing"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/convergence"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/code-generation"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/block-parser"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/templates"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/integration"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/demo-workflow"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/cli"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/installation"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/user-flows"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/troubleshooting"
  # New specs added after @adversary review
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/package-json"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/tsconfig-json"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/header-parser"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/events"
  - "@ref:specs/roadmap.spec.dir/poc.spec.dir/error-handling"
 - "@ref:specs/roadmap.spec.dir/poc.spec.dir/template-registry"
depends_on:
  - "@ref:specs/daemon"
  - "@ref:specs/cascade"
  - "@ref:specs/agents"
---

# POC Phase: Proof of Concept

**Goal**: Demonstrate that specs can trigger code generation via reactive cascade.

## 📋 In Scope for POC

When implementing the POC, these are the ONLY specs you need to read and implement:

### Core POC Specs (in this directory)

#### Foundation (Read These First)
| Spec | Purpose | Implementation File |
|------|---------|---------------------|
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/installation] | **How to install and setup** | - |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/types] | **TypeScript types & interfaces** | `src/types/poc.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/database] | **SQLite database schema** | `src/db/poc-db.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/cli] | **CLI interface & commands** | - |

#### UX & User Experience
| Spec | Purpose | Implementation File |
|------|---------|---------------------|
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/user-flows] | **User interaction flows** | - |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/troubleshooting] | **Problem solving guide** | - |

#### Implementation Components
| Spec | Purpose | Implementation File |
|------|---------|---------------------|
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/poc-daemon] | Main entry point | `src/daemon/poc-daemon.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/simple-agent] | Single agent that processes specs | `src/daemon/simple-agent.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/file-watcher] | File change detection | `src/daemon/file-watcher.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/event-routing] | Simple event routing | `src/daemon/event-router.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/convergence] | Detect cascade completion | `src/daemon/convergence.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/block-parser] | Parse @block: from markdown | `src/parser/block-parser.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/header-parser] | Parse spec headers (YAML) | `src/parser/header-parser.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/templates] | Code generation templates | `src/codegen/templates/*.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/template-registry] | Template loading/management | `src/codegen/template-registry.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/code-generation] | Code generation overview | `src/codegen/generator.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/events] | Event system interface | `src/events/typed-emitter.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/error-handling] | Error recovery strategies | `src/errors/handler.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/package-json] | Package dependencies | `package.json` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/tsconfig-json] | TypeScript config | `tsconfig.json` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/tests] | **Complete test suite** | `tests/**/*.test.ts` |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/integration] | Component wiring guide | - |
| [@ref:specs/roadmap.spec.dir/poc.spec.dir/demo-workflow] | Happy path example | - |

### Reference Specs (for context only)

These specs provide background but are NOT directly implemented for POC:

- [@ref:specs/daemon] - Full daemon architecture (MVP)
- [@ref:specs/cascade] - Full cascade system (MVP)
- [@ref:specs/agents] - Full multi-agent system (MVP)

### Implementation Priority

**Phase 1 (Foundation):**
1. Types & Constants ← Start here
2. Event System
3. Error Handling
4. File Watcher
5. Header Parser
6. Block Parser

**Phase 2 (Core):**
7. Template Registry
8. Code Generator
9. Simple Agent ← The brain
10. Event Router
11. Convergence Detector

**Phase 3 (Integration):**
12. Database Layer
13. POC Daemon ← Wire everything
14. Demo Workflow ← Verify it works

**Configuration:**
15. package.json (dependencies)
16. tsconfig.json (compiler options)

**Out of Scope for POC (MVP only):**
- Multi-agent coordination
- Agent queues
- File ownership enforcement
- Advanced validation rules
- Rollback/undo
- MCP server
- Authentication
- Monitoring dashboard

: Proof of Concept

**Goal**: Demonstrate that specs can trigger code generation via reactive cascade.

## User Story

> As a developer, when I edit a spec file, the system automatically generates corresponding code within 5 seconds.

## Technical Requirements

### 1. File Watcher (P1-001, P1-006)

**Must Have:**
- [ ] Watch `specs/` directory for changes
- [ ] Detect file create/update/delete events
- [ ] Debounce rapid changes (300ms)
- [ ] Emit structured events

**Implementation:**
- Use `fs.watch` or `chokidar` for watching
- Event format: `{ type: 'change', path: 'specs/foo.spec.md', timestamp: 123456 }`

### 2. Event Routing (P1-008)

**Must Have:**
- [ ] Parse spec header to determine owner
- [ ] Route events to correct agent
- [ ] Queue concurrent events

**Implementation:**
- Read `# speclang-header` from changed file
- Use `agent_support` field to route
- Queue per-agent to prevent conflicts

### 3. Convergence Detection (P1-007, P0-020)

**Must Have:**
- [ ] Detect 5-second quiet period
- [ ] Emit convergence event
- [ ] Track cascade depth

**Implementation:**
- Timer resets on each file change
- Convergence = no changes for 5s
- Max depth = 10 to prevent loops

### 4. Code Generation (P3-001, P3-005)

**Must Have:**
- [ ] Generate TypeScript from specs
- [ ] Create symlinks in `src/`
- [ ] Add SPECLANG-GENERATED header

**Implementation:**
- Template-based generation
- Parse @block: definitions
- Output to `src/` as symlinks

## Acceptance Criteria

✅ **File Change Detection**
```
Given: specs/hello.spec.md exists
When: I edit the file
Then: speclangd detects the change within 1 second
```

✅ **Agent Invocation**
```
Given: A spec change is detected
When: The cascade coordinator processes it
Then: The owning agent is invoked within 2 seconds
```

✅ **Code Generation**
```
Given: specs/hello.spec.md has @block:hello @kind:code
When: Cascade runs
Then: src/hello.ts is generated with correct content
```

✅ **Convergence**
```
Given: Multiple file changes occur
When: No changes for 5 seconds
Then: Convergence is detected and logged
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Change detection latency | < 1s | Time from save to detection |
| Cascade completion | < 5s | Time from change to convergence |
| Success rate | > 90% | % of cascades that complete |
| Generated code validity | 100% | Code compiles without errors |

## Blockers & Risks

**Technical Risks:**
- File watcher reliability on different OS
- Race conditions with rapid edits
- Circular dependencies causing infinite loops

**Mitigation:**
- Test on macOS, Linux, Windows
- Implement proper locking/queuing
- Enforce max cascade depth

## Timeline

**Week 1**: File watcher + event detection
**Week 2**: Event routing + agent invocation
**Week 3**: Code generation + convergence

**Target**: 3 weeks from start

## Definition of Done

POC is complete when:
- [ ] All acceptance criteria pass
- [ ] Build succeeds (`npm run build`)
- [ ] Demo video recorded
- [ ] Documentation updated

---

**Next Phase**: [MVP](mvp.spec.md)
