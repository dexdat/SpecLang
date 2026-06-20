# speclang-header lines:11
id: "@gitreins/07-judge-orchestrator"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, judge, evaluation]
status: draft
short: "Judge Orchestrator — coordinates evaluator loops, aggregates verdicts, computes scores, and handles recovery"
---

# 07 — Judge Orchestrator

> **Status:** Imported  
> **Realized by:** `engine/judge.py` (136 lines)  
> **Reverse-engineered:** 2026-06-09

## Overview

The Judge orchestrates the evaluation pipeline. It runs tasks through either a configurable pipeline (from `.gitreins/config.yaml`) or a legacy Tier 1 → Tier 2 fallback. It also supports pre-commit-only pipeline execution.

## Requirements

### @block:jdg/pipeline-evaluation @kind:requirement

The `evaluate_task()` method MUST delegate to the Pipeline engine for configurable multi-stage evaluation. The task is converted to a dict and passed through `pipeline.run(task_dict, trigger="pre-eval")`.

**Realized by:** `engine/judge.py:32-68` — `evaluate_task()`, `_run_pipeline()`.

### @block:jdg/legacy-fallback @kind:requirement

When no pipeline stages are configured, the judge MUST fall back to a simple two-tier evaluation: Tier 1 (GuardManager) → Tier 2 (AgenticEvaluator). If Tier 1 fails, Tier 2 is skipped.

**Realized by:** `engine/judge.py:70-96` — `_run_legacy()`.

### @block:jdg/pre-commit-mode @kind:requirement

The `run_precommit()` method MUST run pipeline stages triggered by `pre-commit` only. Returns True if commit should proceed (all pre-commit stages pass).

**Realized by:** `engine/judge.py:98-103`.

### @block:jdg/judge-result @kind:requirement

`JudgeResult` MUST carry: `task_id`, `passed`, `pipeline_result` (dict), `verdict` (AgenticEvaluator Verdict for legacy path). The `summary` property formats results for display.

**Realized by:** `engine/judge.py:106-136`.

### @block:jdg/dependency-injection @kind:requirement

The Judge MUST accept an `LLMClient` and optional `guard_config` dict at construction. GuardManager is instantiated internally.

**Realized by:** `engine/judge.py:21-30`.

### @block:jdg/error-resilience @kind:requirement

Pipeline execution failures MUST be caught and returned as a `JudgeResult` with `passed=False` and error details, rather than raising.

**Realized by:** `engine/judge.py:66-68`.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/07-Judge-Orchestrator.md impl=engine/judge.py
