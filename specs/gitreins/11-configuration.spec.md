# speclang-header lines:11
id: "@gitreins/11-configuration"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, config]
status: imported
short: "Configuration Schema — .gitreins/config.yaml structure for guards, tasks, pipelines, and LLM settings"
realized_by: gitreins-poc/.gitreins/config.yaml
---

# 11 — Configuration Schema

> **Status:** Implemented  
> **Realized by:** `.gitreins/config.yaml` (63 lines)  
> **Reverse-engineered:** 2026-06-09

## 1. Overview

GitReins configuration file format and schema. The config file lives at `.gitreins/config.yaml` in the repo root and controls guards, pipeline stages, evaluator settings, and MCP allowlists.

## Requirements

### @block:cfg/file-location @kind:requirement
#### REQ-CFG-001: Configuration File Location

Configuration MUST be read from `.gitreins/config.yaml` in the repo root. If absent, defaults are used.

**Realized by:** `engine/pipeline.py:383-386`.

### @block:cfg/guards-section @kind:requirement
#### REQ-CFG-002: Guards Section

The `guards` section MUST support these keys:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `secrets` | boolean | true | Enable secrets scanning |
| `lint` | boolean | true | Enable lint checks |
| `tests` | boolean | true | Enable test execution |
| `test_command` | string | "pytest -x --tb=short" | Command to run tests |

**Realized by:** `.gitreins/config.yaml:4-8`, `engine/guard_manager.py:46-53`.

### @block:cfg/pipeline-section @kind:requirement
#### REQ-CFG-003: Pipeline Section

The `pipeline.stages` section MUST be a list of stage definitions. Each stage has:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique stage identifier |
| `parallel` | boolean | no | Run steps concurrently (default false) |
| `on` | string[] | yes | Triggers: pre-commit, pre-eval |
| `condition` | string | no | Conditional execute expression |
| `type` | string | no (required if sequential) | script, ai_eval, output |
| `steps` | object[] | no (required if parallel) | Step definitions |
| `max_iterations` | integer | no | AI eval max iterations |
| `tools` | string[] | no | AI eval tool allowlist |
| `run` | string | no (required for script) | Shell command |
| `on_fail` | string | no | block or continue (default: block) |

**Realized by:** `.gitreins/config.yaml:26-54`, `engine/pipeline.py:14-43`.

### @block:cfg/evaluator-section @kind:requirement
#### REQ-CFG-004: Evaluator Section

The `evaluator` section MUST support:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `max_iterations` | integer | 15 | Default max LLM tool-calling iterations |

**Realized by:** `.gitreins/config.yaml:57-58`.

### @block:cfg/mcp-allowlist @kind:requirement
#### REQ-CFG-005: MCP Allowlist

The `mcp_allowlist` section (optional) MUST support a list of external MCP server entries:

```yaml
mcp_allowlist:
  - server: jira
    tools: ["get_issue", "search_issues"]
```

**Realized by:** `.gitreins/config.yaml:61-63`.

### @block:cfg/yaml-parsing @kind:requirement
#### REQ-CFG-006: YAML Parsing

Configuration MUST be parsed with PyYAML (`yaml.safe_load`). Empty or malformed files result in safe defaults (no pipeline stages → legacy fallback).

**Realized by:** `engine/pipeline.py:417-430`.

### @block:cfg/default-pipeline @kind:requirement
#### REQ-CFG-007: Default Pipeline

The default pipeline (when no config or empty) is:

- Stage tier1: parallel secrets/lint/tests, on: pre-commit + pre-eval, all on_fail: continue
- Stage tier2: ai_eval, on: pre-eval, condition: true, max_iterations: 20

**Realized by:** `engine/pipeline.py:388-415`.

### @block:cfg/config-hot-reload @kind:requirement
#### REQ-CFG-008: Config Hot-Reload

Configuration is loaded fresh on each operation. No caching — changes to config.yaml take effect on next call.

**Realized by:** `engine/pipeline.py:383` — `load_pipeline_config()` called per-operation.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/11-Configuration.md impl=.gitreins/config.yaml
