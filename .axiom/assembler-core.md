# SpecLang — Architectural Core (Assembler, Not Compiler)

## The Assembler Definition

SpecLang is a **multi-language source code assembler**. It does not compile code — it assembles it.

```
Specs (.spec.md)                   Target: any language
┌──────────────┐                   PHP, Python, Go, Ruby,
│  spec files  │ ──[assembler]──▶  Rust, C, Java, TS, ...
│  (source of  │                   Any language with a
│   truth)     │                   compiler/interpreter
└──────────────┘
                       ↓
              [target compiler]
                       ↓
                  Binary / Output
```

The distinction matters: SpecLang reads specs and **assembles** source files. The target language's compiler (gcc, rustc, tsc, `go build`, javac, etc.) then compiles those source files. SpecLang handles the "what code should look like" — the target compiler handles the "does it compile."

## File Extension Convention

Two types of files, distinguished by extension order:

| Pattern | What it is | Example |
|---------|-----------|---------|
| `{name}.spec.md` | **Spec file** — the source of truth. Humans write these. | `auth.spec.md` |
| `{name}.{ext}.spec` | **Code assembly target** — the spec that describes what `{ext}` code to generate | `auth.handler.go.spec`, `user.api.ts.spec` |

The folder structure of `specs/` mirrors the intended output structure. A spec at `specs/api/auth/login.spec.md` generates code at `src/api/auth/login.go` (if the target language is Go).

## Header Controls Everything

Every spec file has a `speclang-header` that controls all assembly decisions:

```yaml
# speclang-header lines:15
id: "@specs/api/auth"
version: 1.0.0
layer: 3
project_level: Alpha
agent_support: agent_autonomous
model: openai/gpt-4o              # ← Which model assembles this file
model_pool: code-gen              # ← Or which capability pool
max_concurrent: 3                 # ← Rate limit for this model
tags: [api, auth, go]
short: Authentication API
depends_on:                       # ← Upstream dependencies
  - "@ref:specs/core/entities"
children:                         # ← Sub-specs
  - "@ref:specs/api/auth/login"
target_lang: go                   # ← Output language
output: src/api/auth/handler.go   # ← Output path
owned-by: codegen                 # ← Which agent role owns this
```

## Dependency Graph — The Cascade Engine

When a spec file changes, the cascade system:

1. **Reads the header** — `depends_on` tells it what upstream specs affect this one. `children` tells it what downstream specs this one affects.
2. **Builds the full graph** — Every `@ref:` link in every header creates an edge. The graph spans the entire `specs/` tree.
3. **Traces impact** — Change `specs/core/entities.spec.md`? The cascade finds every spec that `@ref:specs/core/entities` and marks them as needing re-assembly.
4. **Dispatches agents** — Each affected file gets a Pi agent session with the correct model (from its header), the correct skill (from `owned-by`), and the diff of what changed.
5. **Batch/concurrency control** — Files are grouped by model_pool. The user configures max concurrent agents per pool. The cascade router respects those limits.

## Model Pools and Rate Limits

Users bring their own API keys from multiple providers. The model pool system:

```
Provider A (OpenAI)               Provider B (OpenRouter)
├── gpt-4o: 5 concurrent          ├── gpt-4o: 10 concurrent
├── gpt-4o-mini: 20 concurrent    ├── gpt-4o-mini: 50 concurrent
└── dall-e-3: 2 concurrent        └── claude-3-opus: 5 concurrent

SpecLang Pool Configuration:
  pool "code-gen":
    - openai/gpt-4o (5 concurrency)
    - openrouter/gpt-4o (10 concurrency)
    → Effective: 15 concurrent gpt-4o agents
    → Rate-limited by each provider's cap
    → Same model name = same pool group

  pool "vision":
    - openai/gpt-4o (5 concurrency)
    - openrouter/claude-3-opus (5 concurrency)
    - openrouter/gpt-4o (10 concurrency)
    → Different models, same capability
    → Agent uses whichever is available

  pool "cheap":
    - openai/gpt-4o-mini (20 concurrency)
    - openrouter/gpt-4o-mini (50 concurrency)
    → 70 concurrent, for low-stakes specs
```

**Key rules:**
- Same model from different providers → pooled together (bigger effective rate limit)
- Different models with same capability → grouped in a named pool
- Some providers offer downgraded versions (e.g., GitHub's 128K context vs 400K) — user flags these as `quality: downgrade` and the system avoids them for critical work
- Each pool has a `max_concurrent` setting enforced by the cascade router
- Models in a pool are tried round-robin or by availability

## Assembler Pipeline

```
File change in specs/
    │
    ▼
speclangd (chokidar)
    emits FileChangeEvent
    │
    ▼
Cascade router
  - reads header
  - traces ref graph (depends_on ↑, children ↓)
  - identifies affected files
  - groups by model_pool
  - respects max_concurrent per pool
  - spawns Pi agent sessions
    │
    ▼
Each Pi agent session:
  - loaded with the owning agent's skill
  - receives: spec content, diff, ref context
  - calls LLM (from header's model/pool)
  - produces: assembled source code
  - guard checks: does this agent own this output path?
    │
    ▼
All sessions complete → convergence detected
    │
    ▼
Pipeline:
  1. Write assembled files to target paths
  2. Run target compiler (tsc, go build, rustc, etc.)
  3. Run tests (vitest, cargo test, go test, pytest)
  4. Lint
  5. Git commit with cascade_id
    │
    ▼
If pipeline fails → rollback last change, retry (3x), notify
```

## What Assembler Means vs Compiler

| SpecLang (Assembler) | Target Language (Compiler) |
|---|---|
| Reads `.spec.md` files | Reads `.go`, `.rs`, `.ts`, `.py` files |
| Produces source code in any language | Produces binaries, bytecode, or executables |
| Uses LLM agents to generate code | Uses deterministic compilation rules |
| Handles cross-file dependencies via `@ref:` | Handles import/module resolution |
| `owned-by` and `model` fields control who writes | No concept of "who writes" — just compilation |
| Batch/concurrency modeled per API key pool | Sequential or parallel build targets |

## What Controls Which Model Writes a File

Three-layer resolution (first match wins):

1. **Header `model:` field** — explicit model for this specific spec file
2. **Header `model_pool:` field** — named pool (all models with this capability)
3. **File pattern** — `specs/**/*.spec.md` maps to default model_pool "spec-writer", `**/*.go.spec` maps to "code-gen"

The header always wins. An individual spec can override the default model for its role.

## What I'm Updating

The specs on `pi-agent-migration` need a new top-level spec (`specs/assembler.spec.md`) that replaces the "compiler" framing with "assembler" — and the `compiler.spec.md` needs updating to distinguish what SpecLang does (assemble code) from what the target compiler does (compile assembled code). The compiler spec should reference the assembler as its upstream.

Shall I update the specs on the branch to reflect this, or are we aligned enough to start building PI-001?
