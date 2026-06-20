# speclang-header lines:10
id: "@gitreins/01-architecture"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, architecture, data-flow]
status: imported
short: "GitReins architecture and data flow — system identity, tiered evaluation, component dependency graph, technology stack, and non-functional requirements"
---

# 01 — Architecture & Data Flow

> **Status:** Implemented
> **Realized by:** `engine/`, `gitreins_mcp/`, `gitreins/`
> **Reverse-engineered:** 2026-06-09

## 1. System Identity

GitReins is a **git-native AI agent co-harness** — it lives inside git repositories and provides MCP tools for task lifecycle management, an agentic evaluator that judges code completeness against task definitions, and git hooks that enforce quality gates.

### @block:arch-001/primary-agent-integration @kind:requirement

**REQ-ARCH-001: Primary Agent Integration**

External AI coding agents (Pi, Claude, Hermes, Codex) connect via MCP stdio transport. The primary agent does creative code generation; GitReins manages task lifecycle, enforces quality, and validates completeness. The primary agent has no direct git commit access — commits MUST go through the harness.

**realized_by:** `gitreins_mcp/server.py` — `GitReinsMCPServer` class with `run_stdio()` method.

### @block:arch-002/tiered-evaluation-architecture @kind:requirement

**REQ-ARCH-002: Tiered Evaluation Architecture**

Evaluation proceeds in two tiers:

1. **Tier 1 (Static Guards):** Secrets scanning, lint, staged tests. No LLM dependency. Fast (<100ms). Runs at pre-commit and pre-eval.
2. **Tier 2 (Agentic Evaluator):** LLM-powered iterative loop with 7 tools. Reads files, runs tests, searches patterns, delivers structured verdict.

**realized_by:** `engine/guard_manager.py` (Tier 1), `engine/evaluator.py` (Tier 2), `engine/judge.py` (orchestration), `engine/pipeline.py` (configurable pipeline).

### @block:arch-003/component-dependency-graph @kind:requirement

**REQ-ARCH-003: Component Dependency Graph**

```
LLM Interface (engine/llm.py)
    ↓ used by
Agentic Evaluator (engine/evaluator.py)  ←  Guard Manager (engine/guard_manager.py)
    ↓                                          ↓
Pipeline Engine (engine/pipeline.py)   ←  Task Manager (engine/task_manager.py)
    ↓                                          ↓
Judge Orchestrator (engine/judge.py)  ←---------┘
    ↓
MCP Server (gitreins_mcp/server.py)
    ↓
CLI (gitreins/cli.py)
    ↓
Git Hooks (.git/hooks/pre-commit)
Install Script (gitreins/install)
```

**realized_by:** Import graph in each module.

### @block:arch-004/data-flow @kind:requirement

**REQ-ARCH-004: Data Flow**

```
Agent completes items
    → Tier 1 (Static Guards): secrets, lint, tests
    → Tier 2 (Agentic Evaluator): LLM loop with tools
    → git commit (only if all pass)

Bypass attempt (direct git commit)
    → pre-commit hook detects
    → REJECTED
```

**realized_by:** `engine/judge.py` — `Judge.evaluate_task()`, `gitreins/cli.py` — `cmd_commit()`, `gitreins/install` — hook installation.

### @block:arch-005/zero-infrastructure @kind:requirement

**REQ-ARCH-005: Zero Infrastructure**

Everything lives in the repo. No servers, no CI, no external services beyond LLM API. Python 3.10+ runtime, 3 pip dependencies (mcp, pyyaml, requests).

**realized_by:** `requirements.txt` — 3 packages.

### @block:arch-006/configuration @kind:requirement

**REQ-ARCH-006: Configuration**

Configuration lives in `.gitreins/config.yaml` in the repo root. Controls: guards (secrets/lint/tests on/off), pipeline stages, evaluator settings, MCP allowlist.

**realized_by:** `engine/pipeline.py` — `load_pipeline_config()`, `engine/guard_manager.py` — `GuardManager.__init__()`.

## 2. Technology Stack (Normative)

- **Language:** Python 3.10+ (Ubuntu 22.04 LTS standard)
- **Dependencies:** mcp, pyyaml, requests (3 packages — minimal supply chain)
- **LLM API:** Direct HTTP (requests) — OpenAI + Anthropic
- **Evaluator Model:** Haiku / GPT-4o-mini (<2s, ~$0.001/check)
- **MCP Transport:** stdio (Standard MCP)
- **Git Backend:** subprocess (git CLI) — no libgit2
- **Config Format:** YAML (`.gitreins/config.yaml`)
- **Task Storage:** YAML (`.gitreins/tasks.yaml`)

## 3. Non-Functional Requirements

### @block:nfr-arch-001/performance @kind:requirement

**NFR-ARCH-001: Performance**

- Tier 1: Under 100ms (no LLM)
- Tier 2: Under 3s for typical tasks (Haiku/GPT-4o-mini)
- Evaluator max iterations: 15 (default), configurable to 20

### @block:nfr-arch-002/reliability @kind:requirement

**NFR-ARCH-002: Reliability**

- LLM calls retry up to 3 times with exponential backoff (2^n seconds)
- 4xx errors (except 429) not retried
- Subprocess calls have timeouts (30s-120s depending on operation)

### @block:nfr-arch-003/security @kind:requirement

**NFR-ARCH-003: Security**

- Workdir sandboxing: `read_file` validated to stay within workdir boundaries
- Sandbox (`.git/gitreins-sandbox/`) isolated from working tree
- Secrets scanning both at guard stage and pre-commit hook
- Built-in secrets scanner with whitelist for false positives
- gitleaks preferred; falls back to built-in scanner

### @block:nfr-arch-004/portability @kind:requirement

**NFR-ARCH-004: Portability**

- Python 3.10+ with 3 pip dependencies
- Works on Linux, macOS, WSL, CI runners
- Install via single shell script (`gitreins/install`)

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/01-Architecture.md
