# speclang-header lines:15
id: "@speclang/roadmap/poc-vs-mvp"
parent: "@ref:specs/roadmap"
version: 1.0.0
layer: 1
short: "Clear separation of POC vs MVP features"
tags: [roadmap, poc, mvp, comparison, scope]
---

# POC vs MVP: Feature Comparison

Clear separation of what gets built in POC vs MVP phases.

## Philosophy

**POC**: Prove the concept works with minimal complexity
**MVP**: Production-ready multi-agent system

## Feature Matrix

| Feature | POC | MVP | Notes |
|---------|-----|-----|-------|
| **Agents** | 1 (SimpleAgent) | 4+ (NorthStar, SpecWriter, CodeGen, TestWriter) | POC: single agent does all |
| **Agent Coordination** | ❌ None | ✅ Full coordination | POC: direct call, no queues |
| **File Watcher** | ✅ chokidar | ✅ chokidar | Same implementation |
| **Event Routing** | ✅ Direct | ✅ With selection | POC: all → one agent |
| **Convergence Detection** | ✅ 5-second quiet | ✅ Smart detection | POC: simple timer |
| **Code Generation** | ✅ TypeScript only | ✅ TS, Go, Python | POC: one language |
| **Symlinks** | ✅ Yes | ✅ Yes | Same dual-view pattern |
| **Build Integration** | ✅ npm run build | ✅ Full pipeline | POC: just build |
| **Testing** | ❌ None | ✅ Automated tests | POC: manual verification |
| **Validation** | ❌ None | ✅ Spec validation | POC: trust the spec |
| **Error Recovery** | ❌ Log and skip | ✅ Retry, rollback | POC: fail fast |
| **SQLite Index** | ❌ Optional | ✅ Required | POC: file system only |
| **Queues** | ❌ None | ✅ Per-agent queues | POC: synchronous |
| **File Ownership** | ❌ None | ✅ Enforced | POC: single agent |
| **Cascade Depth** | ✅ Hard limit (10) | ✅ Smart limits | POC: simple counter |
| **MCP Server** | ❌ None | ✅ Full server | POC: not needed |
| **Authentication** | ❌ None | ✅ OAuth/API keys | POC: local only |
| **Monitoring** | ❌ Console logs | ✅ Dashboard | POC: stdout only |

## POC Scope: "Hello World" Cascade

**Goal**: Edit spec → Code generates → Build passes

**Components:**
1. FileWatcher (detects changes)
2. EventRouter (direct to agent)
3. SimpleAgent (parses + generates)
4. ConvergenceDetector (knows when done)

**Flow:**
```
User edits spec
    ↓
FileWatcher detects
    ↓
EventRouter → SimpleAgent
    ↓
SimpleAgent parses spec
    ↓
SimpleAgent generates code
    ↓
SimpleAgent creates symlinks
    ↓
Convergence detected
    ↓
User runs npm run build
    ↓
✅ Success!
```

## MVP Scope: Multi-Agent Production System

**Goal**: Autonomous agents collaborate to build complex systems

**Components:**
1. **speclangd** (daemon with all features)
2. **NorthStar Agent** (user intent, high-level specs)
3. **SpecWriter Agent** (expands specs)
4. **CodeGen Agent** (generates code)
5. **TestWriter Agent** (writes tests)
6. **Pipeline** (build → test → deploy)
7. **Recovery System** (handles failures)
8. **MCP Server** (human-in-the-loop)
9. **Monitoring Dashboard** (observability)

**Flow:**
```
User edits project.scl
    ↓
NorthStar Agent analyzes
    ↓
SpecWriter creates detailed specs
    ↓
CodeGen generates implementation
    ↓
TestWriter creates tests
    ↓
Pipeline executes
    ↓
If failure → Recovery System
    ↓
If ambiguous → MCP asks human
    ↓
✅ Deployed!
```

## What POC Proves

✅ Specs can trigger code generation
✅ Reactive cascade works
✅ Dual-view pattern is viable
✅ Build integration works
✅ Fast feedback loop (< 5s)

## What MVP Adds

✅ Scale (1000s of files)
✅ Reliability (99.9% uptime)
✅ Multi-language support
✅ Autonomous operation
✅ Error recovery
✅ Human collaboration
✅ Enterprise features

## Rule of Thumb

**If it can be simpler for POC, make it simpler.**

**POC Questions:**
- Do we need this to prove the concept? → If no, defer to MVP
- Can we hardcode it? → If yes, do it
- Is it single-user? → If yes, skip auth/multi-tenancy
- Is error handling "log and continue"? → If yes, good enough for POC

**MVP Questions:**
- Does it need to work for a team? → Add auth, collaboration
- Does it need to be reliable? → Add error handling, recovery
- Does it need to scale? → Add queues, optimization
- Does it need to be autonomous? → Add AI agents, MCP
