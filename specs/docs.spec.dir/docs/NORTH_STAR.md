# speclang-header lines:14
# id: @specs/docs
# version: 1.0.0
# layer: 5

# North Star

## The Mission

**Specs are source code. Generated code is machine code.**

SpecLang is a reactive multi-agent system where natural language specifications self-assemble into working code, with enough depth for autonomous agents to operate totally. Humans write specs. AI writes code. The specs are what we review, version, and maintain.

---

## The Vision

### What We're Building

A world where:
- **Intent lives in specs**, not code
- **Specs are the source of truth** - portable, versioned, human-readable
- **Generated code is disposable** - rebuild anytime from specs
- **AI agents collaborate** in a reactive cascade, each owning their files
- **Autonomous agents operate totally** - specs have enough depth for full agent autonomy
- **Context never gets lost** - every file points to its dependencies
- **Git history is perfect** - per-file commits trace every change to its origin

### The Reactive Loop

```
Human writes intent → North Star file
     ↓
File change detected (native inotify)
     ↓
Owning agent reacts, creates/updates files
     ↓
Cascade continues until quiet (convergence)
     ↓
Pipeline runs: build, test, deploy
     ↓
Clean git commits with perfect traceability
     ↓
Working code in any language
```

---

## Core Principles

### 1. Specs Are Source Code

Machine code is not human-readable. Generated code should not be either.

- **Review specs, not generated code**
- **Specs version in git, code regenerates**
- **Specs port to any language, code is locked to one**
- **Specs describe intent, code describes implementation**

> "When was the last time you reviewed machine code?"

### 2. Universal Headers

Every file knows where it came from and what it depends on.

```yaml
# speclang-header lines:15
id: @specs/auth#login
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_autonomous
tags: [auth, login, security]
short: User authentication login flow
depends_on:
  - ""@ref:specs/users#modelcaused_by: "@change:e4f5g6h"    # optional: what triggered this
change_id: "@change:a1b2c3d"    # optional: this change's ID
part_of: "@cascade:20250222-001" # optional: cascade this belongs to
---
```

- **Traceability**: Follow refs to understand dependencies
- **Context preservation**: AI never loses context  
- **Integrity**: Verify specs match generated code
- **Causality tracking**: UUIDs link related changes even if commits happen out of order

### 3. Agent Ownership by Depth

Every file has an owner based on its depth in the dependency tree. Only the owner writes to it.

| Agent | Owns (Depth Range) | Does |
|-------|-------------------|------|
| North Star | `project.scl` (depth 0) | User intent, high-level direction |
| Spec Writer | `specs/**/*.spec.md`, `.spec.yaml` (depth 1-4) | Expands high-level specs into detailed specs |
| Code Gen | `*.{ext}.spec` files (depth 5) | Creates direct code-mapping specs |
| Code Gen | `generated/**/*.{go,ts,py}` (depth 6) | Generates target language code from specs |
| Test Writer | `*.test.spec.*` (depth 7-8) | Writes test specs and generates test code |
| Orchestrator | (temporary during failures) | Handles failures, edits multiple files, releases control |
| Back Sync | (reads generated) | Syncs code changes back to specs |

**Rules:**
- One agent per file (except orchestrator during recovery)
- Agents react to changes in files they depend on
- No human edits to generated code (use Back Sync)
- Queue system manages concurrent agent execution with throttling
- Orchestrator agent handles failures by editing specs/code, then cascade resumes

### 4. The Cascade - Spanning Tree Architecture

Specs form a spanning tree dependency structure, not fixed abstraction layers. The cascade expands this tree until leaves (code-mapping specs) are reached.

1. User edits `project.scl` (root, depth 0) → triggers Spec Writer
2. Spec Writer creates `specs/auth.scl` (depth 1) → triggers deeper specs
3. Spec Writer expands to `specs/auth/entities.spec.yaml` (depth 2) → triggers Code Gen
4. Code Gen writes `specs/auth/handler.go.spec` (depth 5, leaf) → generates code
5. Code Gen produces `generated/go/auth/handler.go` → triggers Test Writer
6. Test Writer creates `tests/auth.test.spec.md` → generates tests
7. Quiet period detected → convergence → pipeline runs

**Spanning Tree**: Specs form a dependency tree that expands to whatever depth the system requires. No artificial limits on layers.

**Convergence:** When no file changes for 30 seconds, the system is done.

**UUID Tracking**: Each cascade has a unique ID; each change has a UUID linking to its parent, enabling flow reconstruction even if commits happen out of order.

**Failure Recovery**: When build/test fails, an orchestrator agent analyzes the failure, edits multiple specs/code files to fix issues, then releases control so the cascade resumes. This temporary multi-file write access enables intelligent recovery without human intervention.

### 5. Context Window Advantage - The Scientific Theory

**The fundamental insight: AI context windows are finite, but software systems are unbounded.**

SpecLang solves this through **slice-based architecture**:
- Each agent owns **one file** and sees only its **explicit dependencies** (`@ref:`)
- Working set always fits in context: Agent prompt + owned file + 2-4 dependencies
- No RAG, no guessing, no "relevant code" retrieval - deterministic context by design

**Why this matters:**
- Other tools use probabilistic retrieval (may miss critical context)
- SpecLang uses explicit references (guaranteed complete context)
- Agents work in parallel (isolated working sets, no conflicts)
- System scales indefinitely (context required = O(dependency depth), not O(codebase size))

**The Scientific Claim:** By architecting systems into context-sized slices with explicit dependencies, we achieve deterministic code generation at any scale without context overflow.

### 6. Context Never Lost - MCP Communication Hub

- **SQLite database** indexes all specs with FTS and vector search
- **Graph system** visualizes dependency tree and provides search tools for agents
- **Pointer graph** connects every file to its dependencies
- **North Star** is always reachable from any file
- **Agent sessions** persist state across interruptions
- **System state management** in SQLite helps agents understand project structure
- **Everything from specs**: Build pipeline, tests, Docker configs, deployment scripts all generated from specs
- **MCP Server**: `speclangd` and/or `npx mcp` server connects to SQLite, providing:
  - Message inbox for human agents to query spec issues reported by autonomous agents
  - Protocol for agents to report ambiguities, incompleteness, validation failures
  - Human agents can respond, update specs, flag messages as resolved
  - Real-time communication channel between autonomous system and human oversight

### 6. Git Is Memory

```bash
# Per-file commits with UUID-linked causality chains
git commit --only specs/auth.scl -m "speclang: added password validation [change_id:a1b2c3d parent:e4f5g6h]"
git commit --only src/auth/handler.go -m "speclang: generated validation logic [change_id:b2c3d4e parent:a1b2c3d]"
```

- **Perfect traceability**: Every change tracked with UUIDs linking to parent changes
- **Causality chains**: Understand what caused what, even if commits happen out of order
- **Git as memory system**: No separate memory-bank needed; git history provides full context
- **Scalable history**: Git handles large project histories naturally
- **Audit trail**: Complete compliance-ready change history with UUID links
- **Easy rollback**: Per-file commits enable precise rollbacks to any point

---

### 7. Autonomous Agent Depth

Specs should have enough depth to be used by autonomous agents totally. SpecLang supports project maturity levels from POC to Enterprise, each with clear depth requirements:

- **POC** (Proof of Concept): Experimental, minimal validation
- **MVP** (Minimum Viable Product): Core functionality validated  
- **Alpha**: Internal testing, incomplete features
- **Beta**: External testing, feature complete
- **Production**: Stable, production-ready
- **Startup**: Small team, rapid iteration
- **SMB** (Small/Medium Business): Established processes, moderate scale
- **MSB** (Medium/Large Business): Complex integration, compliance focus
- **Enterprise**: Maximum scale, strict governance

For autonomous operation, specs must include:
- `agent_support: agent_autonomous` header field
- Comprehensive `@ref:` dependencies
- Explicit step-by-step descriptions
- Validation rules resolving ambiguities
- Consistent `layer` values (depth in dependency tree, not fixed abstraction scale)

### 8. Project Scope Dictates Depth

The project scope (weekend project vs enterprise project) determines how much depth and validation is needed:

- **Weekend Project**: Minimal depth, rapid iteration, fewer guardrails
- **Enterprise Project**: Maximum depth, comprehensive validation, strict compliance
- **User-configurable**: Developers can modify depth requirements via `.opencode/skills/` definitions
- **AI-guided expansion**: The system expands specs to meet the defined requirements
- **Real code generation**: Specs produce real Go/TypeScript/Python code with headers pointing back to specs (the "ghost" in generated code)

### 9. Continuous Improvement Loop

SpecLang enables applications that constantly evolve and improve, like OpenClaw:

```
Human talks with AI (OpenClaw) → AI updates specs → SpecLang builds application → 
Reports back to AI → AI communicates with human (WhatsApp/email) → Loop continues
```

**Key Components:**
- **MCP Message Inbox**: AI agents report spec issues to human agents
- **Human-AI Collaboration**: Clear protocol for resolving ambiguities
- **Self-improving system**: Tests run, failures reported, specs updated, code regenerated
- **No "finished" state**: Applications are always changing and improving
- **Quality gates**: User-defined conditions determine when iterations stop

**The Vision**: A world where your AI assistant focuses on writing specs, communicates with you about issues, and your application continuously improves through the SpecLang cascade.

## Success Criteria

### Technical Goals

- [ ] **Self-specifying**: Specs define the language itself
- [ ] **Language-agnostic**: Generate Go, TypeScript, Python, Rust, Java, etc.
- [ ] **Scalable**: Handle 10 files or 10,000 files
- [ ] **Fast**: Cascade completes in seconds, not minutes
- [ ] **Reliable**: 99.9% convergence success rate
- [ ] **Autonomous agent support**: Specs detailed enough for full agent autonomy

### Developer Experience

- [ ] **Zero config**: `speclang init` gets you started
- [ ] **Natural language**: "I want a user auth system with JWT"
- [ ] **Instant feedback**: See specs expand in real-time
- [ ] **Trust the cascade**: Review specs, trust generated code
- [ ] **Port anywhere**: Take `specs/` folder, rebuild on any machine

### Quality Goals

- [ ] **Generated code compiles** on first run
- [ ] **Tests pass** without human intervention
- [ ] **Type safety** maintained across language boundaries
- [ ] **Documentation** generated from specs
- [ ] **Security** enforced at spec level

---

## Anti-Goals

What SpecLang is NOT:

- **Not a code editor** - use OpenCode, Cursor, Zed, etc.
- **Not a replacement for thinking** - specs require clear intent
- **Not magic** - garbage specs produce garbage code
- **Not for hand-tuning** - edit specs, not generated code
- **Not a monolith** - distributed agents, not central orchestrator

---

## The Meta-Circular Nature

SpecLang is self-specifying. The specs define:
- The spec format itself
- The agent protocol
- The cascade mechanism
- The SQLite schema
- The MCP server
- Even this North Star document

This is not circular reasoning. It's a bootstrap:
1. Human writes first specs (like this file)
2. AI implements the system based on those specs
3. System can then spec itself

The specs are the ground truth. The code is generated.

---

## Next Steps

See the specs in `specs/` for implementation details:

- `speclang.spec.md` - Core concepts and reactive loop
- `cascade.spec.md` - How the cascade works
- `agent-protocol.spec.md` - Agent communication
- `sqlite.spec.md` - Database schema
- `mcp.spec.md` - MCP server specification
- `mcp.spec.dir/messages.spec.md` - MCP message protocol for agent-human communication
- `project-maturity-levels.spec.dir/depth-requirements.spec.md` - Depth requirements by project scope
- `cascade.spec.dir/continuous-improvement.spec.md` - Continuous improvement loop

Or check the SIPs in `.opencode/skills/`:

- SIP-0: What is SpecLang
- SIP-6: Agent Protocol
- SIP-7: Cascade System

---

## The Ultimate Test

> A developer should be able to take only the `specs/` folder to a new machine, run `speclang build`, and get working code.

No dependencies. No lock files. No node_modules. No venv.

Just specs. And from specs, everything else flows.

---

*This is the North Star. All implementation details follow from these principles.*
