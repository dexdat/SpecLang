![Tests](https://img.shields.io/badge/tests-89%20passed-brightgreen)
![Python](https://img.shields.io/badge/python-3.11%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

# Chimera — Dynamic Multi-Model Formation Engine

A multi-model deliberation system using dynamic formation DAGs.
Like Fullmetal Alchemist's chimera: multiple models fused into one superior output.

NOT a jury (all models answer same question → pick best).
A **team** (coordinator assigns roles → workers do different things → merger assembles).

Flow:
  User Prompt → ① REWRITER (Strategist) → decomposes, designs formation
                                    ↓
              ② DISPATCHER → assigns models by domain strength
                    ↓
         ┌─────────┼─────────┐
    Worker A    Worker B    Worker C    (parallel, asyncio.gather)
         └─────────┼─────────┘
                    ↓
              ③ JUDGE/MERGER → scoring offsets, consensus, contradictions
                    ↓
              ④ FINAL JUDGE → structured output

@ref: specs/config.spec.py.md → ## Formation Presets

Formations:
  simple-1-2-1:
    stages: rewrite → 2 workers → judge
    use: Quick answers, standard deliberation

  audit-1-3-1-2-1:
    stages: rewrite → 3 workers → judge → 2 auditors → final judge
    use: High-stakes correctness, code review, security audit

  dual-judge-1-3-2-1:
    stages: rewrite → 3 workers → 2 judges → merge
    use: Bias-resistant decisions, controversial topics

  hierarchical-1-2-2-1:
    stages: rewrite → 2 sub-teams (2 each) → merge → judge
    use: Complex multi-domain problems (e.g., full-stack app)

  rewrite-only:
    stages: rewrite only
    use: Mode A stage-by-stage (Hermes drives the pipeline)

@ref: project.scl → ## Technology

Install:
  pip install -e ".[full]"

CLI (Mode B — Auto-Pilot):
  chimera deliberate "Compare Rust and Go for systems programming"

CLI (Mode A — Stage-by-Stage):
  chimera rewrite "Design a REST API for a task queue"
  chimera execute --model deepseek/deepseek-chat "Implement the worker dispatch"
  chimera judge --instructions merge.md --results workers.json

REST API:
  chimera-server                    # starts on :9191
  curl -X POST localhost:9191/v1/deliberate \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Explain CAP theorem"}'
  # OpenAPI docs at http://localhost:9191/docs

MCP (Hermes):
  chimera-mcp    # stdio JSON-RPC, 5 tools

@ref: specs/rewriter.spec.py.md
@ref: specs/dispatcher.spec.py.md
@ref: specs/judge.spec.py.md
@ref: specs/formation-engine.spec.py.md
@ref: specs/gateway.spec.py.md
@ref: specs/catalog.spec.py.md
@ref: specs/api.spec.py.md
@ref: specs/cli.spec.py.md
@ref: specs/mcp.spec.py.md
@ref: specs/config.spec.py.md

Components:
  Rewriter:
    role: Stage 1 — prompt optimization, task decomposition, formation design
    input: raw user prompt
    output: RewriterResult (task_analysis, worker_prompts, merge_instructions)

  Dispatcher:
    role: Model selection by domain strength, role assignment, prompt tailoring
    input: RewriterResult + RoutingConfig
    output: DispatchPlan with per-worker assignments and scoring weights

  Judge:
    role: Result merging with 4 strategies
    strategies: concatenate, structured_diff, single_best, vote
    output: JudgeVerdict (merged, confidence, consensus, contradictions)

  FormationEngine:
    role: Dynamic DAG executor — asyncio parallel workers, audit stages, dual judge
    features: build_formation_from_rewriter(), stage-by-stage context chaining

  ProviderGateway:
    role: Internal litellm-backed abstraction over 100+ LLM providers
    features: structured output, retries, OpenRouter routing, custom providers

  ModelRegistry:
    role: models.dev sync + domain-based best-model selection + scoring offsets
    sync: periodic 24h from models.dev API

@ref: project.scl → ## Two Operating Modes

Mode A — Hermes as Dispatcher:
  Hermes calls individual stages, uses own context to decide dispatch.
  Chimera provides the stages. Hermes drives the pipeline.
  Endpoints: /v1/rewrite → /v1/execute → /v1/judge

Mode B — Auto-Pilot:
  Single call. Chimera runs full pipeline internally.
  Endpoint: POST /v1/deliberate
  Flow: Rewrite → Dispatch → Execute → Judge → Output

@ref: project.scl → ## Config Sketch

ConfigFile: chimera.yaml (gitignored — contains API keys)

Structure:
  providers: {openrouter, deepseek, anthropic, openai, google, custom}
  pipeline: {rewriter_model, judge_model, max_workers, timeout}
  routing: {rules (domain→prefer/exclude), scoring (model→domain→weight)}
  formations: [FormationSpec...]  # preset formations
  active_formation: simple-1-2-1

@ref: project.scl → ## Technology

Stack:
  language: Python 3.11+
  core: asyncio, Pydantic, litellm, httpx
  interfaces: FastAPI, Click + Rich, MCP SDK
  dev: pytest + pytest-asyncio, ruff, mypy
  catalog: models.dev API

@ref: project.scl → ## Decisions

ADRs:
  1: Dynamic formation engine (not fixed 1-X-1, DAG designed on the fly)
  2: Triple interface (REST + CLI + MCP)
  3: Dual modes (Hermes-as-dispatcher + Auto-pilot)
  4: models.dev as model catalog
  5: Internal provider gateway (litellm-backed, no external gateway)
  6: Python (best SDK ecosystem, models write it best, litellm native)
  7: SpecLang-driven development (specs define architecture, cascade generates code)

Commands:
  pip install -e ".[dev,full]"
  ruff check --fix src/ tests/
  mypy src/
  pytest tests/ -v

MIT