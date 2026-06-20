# speclang-header lines:255
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
depends_on:"



## 📋 In Scope for POC


### Core POC Specs (in this directory)

#### Foundation (Read These First)
| Spec | Purpose | Implementation File |
|------|---------|---------------------|

#### UX & User Experience
| Spec | Purpose | Implementation File |
|------|---------|---------------------|

#### Implementation Components
| Spec | Purpose | Implementation File |
|------|---------|---------------------|

### Reference Specs (for context only)



### Implementation Priority

1. Types & Constants ← Start here
2. Event System
3. Error Handling
4. File Watcher
5. Header Parser
6. Block Parser

7. Template Registry
8. Code Generator
9. Simple Agent ← The brain
10. Event Router
11. Convergence Detector

12. Database Layer
13. POC Daemon ← Wire everything
14. Demo Workflow ← Verify it works

15. package.json (dependencies)
16. tsconfig.json (compiler options)

- Multi-agent coordination
- Agent queues
- File ownership enforcement
- Advanced validation rules
- Rollback/undo
- MCP server
- Authentication
- Monitoring dashboard



## User Story

> As a developer, when I edit a spec file, the system automatically generates corresponding code within 5 seconds.

## Technical Requirements

### 1. File Watcher (P1-001, P1-006)

- [ ] Watch `specs/` directory for changes
- [ ] Detect file create/update/delete events
- [ ] Debounce rapid changes (300ms)
- [ ] Emit structured events

- Use `fs.watch` or `chokidar` for watching

### 2. Event Routing (P1-008)

- [ ] Parse spec header to determine owner
- [ ] Route events to correct agent
- [ ] Queue concurrent events

- Read `# speclang-header` from changed file
- Use `agent_support` field to route
- Queue per-agent to prevent conflicts

### 3. Convergence Detection (P1-007, P0-020)

- [ ] Detect 5-second quiet period
- [ ] Emit convergence event
- [ ] Track cascade depth

- Timer resets on each file change
- Convergence = no changes for 5s
- Max depth = 10 to prevent loops

### 4. Code Generation (P3-001, P3-005)

- [ ] Generate TypeScript from specs
- [ ] Create symlinks in `src/`
- [ ] Add SPECLANG-GENERATED header

- Template-based generation
- Output to `src/` as symlinks

## Acceptance Criteria

✅ **File Change Detection**
```
```

✅ **Agent Invocation**
```
```

✅ **Code Generation**
```
```

✅ **Convergence**
```
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Change detection latency | < 1s | Time from save to detection |
| Cascade completion | < 5s | Time from change to convergence |
| Success rate | > 90% | % of cascades that complete |
| Generated code validity | 100% | Code compiles without errors |

## Blockers & Risks

- File watcher reliability on different OS
- Race conditions with rapid edits
- Circular dependencies causing infinite loops

- Test on macOS, Linux, Windows
- Implement proper locking/queuing
- Enforce max cascade depth

## Timeline



## Implementation TODO

**Implementation Checklist with Exact Spec References**


#### P1.1 - Project Setup
  - Run `npm init`
  - Create directory structure
  - `chokidar`, `sqlite3`, `commander`, `js-yaml`, `glob`

#### P1.2 - Core Utilities
  - Load from `.speclang/config.yaml`
  - Merge with defaults
  - Validate settings
  - `POCError` class with `toUserMessage()`
  - `ErrorHandler` with recovery strategies


#### P2.1 - Event System

#### P2.2 - File Watcher
  - Use `chokidar` for watching

#### P2.3 - Convergence Detection
  - Track files changed
  - Emit 'converged' event with duration, filesChanged


#### P3.1 - Header Parser
  - Validate required fields (id, version, layer)
  - Return `SpecHeader` interface

#### P3.2 - Block Parser
  - Parse return types (complex types allowed)
  - Return `ParsedBlock[]`


#### P4.1 - Templates
  - Add JSDoc comments
  - Handle optional parameters with `?`
  - Include properties with optional marker
  - Handle optional properties with `?`

#### P4.2 - Template Registry

#### P4.3 - Code Generator
  - Add SPECLANG-GENERATED header


#### P5.1 - Simple Agent
  - Parse spec with BlockParser
  - Generate code for each block
  - Create symlinks
  - Handle Windows fallback (copy vs symlink)

#### P5.2 - Event Router

#### P5.3 - POC Daemon
    - FileWatcher → EventRouter → SimpleAgent
    - FileWatcher → ConvergenceDetector
  - Process existing specs on startup


#### P6.1 - Database


#### P7.1 - Component Integration
  - Daemon creates and connects all components

#### P7.2 - Build Integration
  - Run `npm run build` after convergence
  - Verify generated code compiles

#### P7.3 - CLI
  - `./bin/speclangd-poc`
  - Parse arguments with commander
  - Start/stop daemon

#### P7.4 - Tests


#### P8.1 - Demo Workflow
  - Create `specs/greeting.spec.md`
  - Edit file
  - Verify code generates in < 5 seconds
  - Run `npm run build` successfully

#### P8.2 - Documentation
  - Document common errors
  - Document error codes

## Definition of Done

- [ ] All Phase 1-8 TODO items complete
- [ ] All acceptance criteria pass
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Demo video recorded
- [ ] Documentation updated

---

**Next Phase**: [MVP](mvp.spec.md)
