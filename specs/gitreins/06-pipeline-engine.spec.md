# speclang-header lines:11
id: "@gitreins/06-pipeline-engine"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, pipeline]
status: imported
short: "Pipeline Engine — structured pipeline execution with stage lifecycle and failure recovery"
realized_by: gitreins-poc/engine/pipeline.py
---

# 06 — Pipeline Engine

> **Status:** Implemented
> **Realized by:** `engine/pipeline.py` (430 lines)
> **Reverse-engineered:** 2026-06-09

## 1. Overview

The Pipeline Engine provides configurable, multi-stage evaluation pipelines. Pipelines are defined in `.gitreins/config.yaml` as a list of stages. Each stage can be sequential or parallel, with conditional execution and result piping.

### @block:pipe-001/yaml-driven-pipeline-config @kind:requirement

**REQ-PIPE-001: YAML-Driven Pipeline Configuration**

Pipelines MUST be defined in `.gitreins/config.yaml` under `pipeline.stages`. Each stage has: `id`, `parallel` (bool), `on` (trigger list), and either `type` (for sequential) or `steps` (for parallel).

**realized_by:** `engine/pipeline.py:14-43` (docstring), `383-430` (`load_pipeline_config()`).

### @block:pipe-002/stage-types @kind:requirement

**REQ-PIPE-002: Stage Types**

The pipeline MUST support three stage types:

- **`script`** — Shell command execution. Runs via subprocess, captures output.
- **`ai_eval`** — Agentic evaluator. Runs `AgenticEvaluator` against task.
- **`output`** — Result compilation. Templates and displays stage results.

**realized_by:** `engine/pipeline.py:229-327` — `_run_script_step()`, `_run_ai_eval()`, `_run_output()`.

### @block:pipe-003/parallel-stage-execution @kind:requirement

**REQ-PIPE-003: Parallel Stage Execution**

When `parallel: true`, all steps within the stage MUST run concurrently using `ThreadPoolExecutor`. Results are collected via `as_completed`.

**realized_by:** `engine/pipeline.py:190-208` — `_run_parallel_stage()`.

### @block:pipe-004/sequential-stage-execution @kind:requirement

**REQ-PIPE-004: Sequential Stage Execution**

When `parallel: false` or stage has `type`, it runs as a single sequential step.

**realized_by:** `engine/pipeline.py:210-227` — `_run_sequential_stage()`.

### @block:pipe-005/trigger-filtering @kind:requirement

**REQ-PIPE-005: Trigger Filtering**

Each stage MUST declare an `on` list specifying when it runs. Supported triggers: `pre-commit`, `pre-eval`. A stage only runs if the current trigger matches.

**realized_by:** `engine/pipeline.py:118-123`.

### @block:pipe-006/conditional-execution @kind:requirement

**REQ-PIPE-006: Conditional Execution**

Stages MAY specify a `condition` expression. Supported:

- `None`/empty → always true
- `"true"` / `"always"` → always true
- `"stage.X.any_failed"` → true if stage X had failures
- `"stage.X.passed"` → true if stage X passed
- `"task.has_criteria"` → true if task has criteria
- Compound: `"A or B"`, `"A and B"` (left-to-right)

**realized_by:** `engine/pipeline.py:142-188` — `_check_condition()`.

### @block:pipe-007/on-failure-behavior @kind:requirement

**REQ-PIPE-007: On-Failure Behavior**

Script steps MUST support `on_fail` mode:

- `"block"` (default) — mark step failed, stop pipeline
- `"continue"` — mark step failed but continue (allows AI to analyze failures)

**realized_by:** `engine/pipeline.py:243-273` — `_run_script_step()`.

### @block:pipe-008/template-substitution @kind:requirement

**REQ-PIPE-008: Template Substitution**

Pipeline commands and prompts MUST support `{{ var }}` template syntax:

| Template | Expands to |
|----------|-----------|
| `{{ task.id }}` | Task ID |
| `{{ task.title }}` | Task title |
| `{{ task.criteria }}` | JSON array of criteria |
| `{{ stage.&lt;id&gt;.passed }}` | Stage pass/fail |
| `{{ stage.&lt;id&gt;.any_failed }}` | Stage had failures |
| `{{ stage.&lt;id&gt;.summary }}` | Stage summary text |
| `{{ stage.&lt;id&gt; }}` | Full stage result as JSON |
| `{{ stages }}` | All stage results as JSON |

**realized_by:** `engine/pipeline.py:329-358` — `_template()`.

### @block:pipe-009/default-pipeline @kind:requirement

**REQ-PIPE-009: Default Pipeline**

When no config file exists, a default pipeline MUST be provided:

```yaml
stages:
  - id: tier1
    parallel: true
    on: [pre-commit, pre-eval]
    steps:
      - secrets (gitleaks or built-in, on_fail: continue)
      - lint (ruff, on_fail: continue)
      - tests (pytest, on_fail: continue)
  - id: tier2
    type: ai_eval
    on: [pre-eval]
    condition: "true"
    max_iterations: 20
```

**realized_by:** `engine/pipeline.py:383-415` — `load_pipeline_config()`.

### @block:pipe-010/stage-result-data-types @kind:requirement

**REQ-PIPE-010: Stage Result Data Types**

- `StepResult`: `id`, `type`, `passed`, `output`, `error`, `data`.
- `StageResult`: `id`, `passed`, `steps`, `any_failed`, `summary`.

All serialize to dicts for JSON transport.

**realized_by:** `engine/pipeline.py:59-93`.

### @block:pipe-011/pipeline-context-injection @kind:requirement

**REQ-PIPE-011: Pipeline Context Injection**

Previous stage results MUST be accessible to subsequent stages via `_get_pipeline_context()`. The `ai_eval` stage receives pipeline context for its prompt template.

**realized_by:** `engine/pipeline.py:360-364`.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/06-Pipeline-Engine.md impl=engine/pipeline.py
