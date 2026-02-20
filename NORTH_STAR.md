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
--- speclang-header lines:12
id: @specs/auth#login
version: 1.0.0
refs: [@ref:northstar#auth, @ref:specs/users#model]
target: src/auth/login.go
---
```

- **Traceability**: Follow refs to understand dependencies
- **Context preservation**: AI never loses context
- **Integrity**: Verify specs match generated code

### 3. Agent Ownership

Every file has an owner. Only the owner writes to it.

| Agent | Owns | Does |
|-------|------|------|
| North Star | `project.scl` | User intent, high-level direction |
| Spec Writer | `specs/**/*.scl` | Expands high-level specs |
| Code Gen | `src/**/*.{go,ts,py}` | Generates target language |
| Test Writer | `tests/**/*.scl` | Writes tests |
| Back Sync | (reads generated) | Syncs code changes back |

**Rules:**
- One agent per file
- Agents react to changes in files they depend on
- No human edits to generated code (use Back Sync)

### 4. The Cascade

Files trigger files in a reactive loop until convergence.

1. User edits `project.scl` → triggers Spec Writer
2. Spec Writer creates `specs/auth.scl` → triggers Code Gen
3. Code Gen writes `src/auth/handler.go` → triggers Test Writer
4. Test Writer creates `tests/auth.test.scl` → triggers self
5. Quiet period detected → convergence → pipeline runs

**Convergence:** When no file changes for 30 seconds, the system is done.

### 5. Context Never Lost

- **SQLite database** indexes all specs with FTS and vector search
- **Pointer graph** connects every file to its dependencies
- **North Star** is always reachable from any file
- **Agent sessions** persist state across interruptions

### 6. Git Is Memory

```bash
# Per-file commits with clear intent
git commit --only specs/auth.scl -m "speclang: added password validation"
git commit --only src/auth/handler.go -m "speclang: generated validation logic"
```

- Perfect traceability: every generated change links to its spec
- Clean history: no "fix typo" commits mixing unrelated changes
- Portability: `specs/` folder contains everything needed to rebuild

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
- Consistent `layer` values (0-10 abstraction scale)

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
