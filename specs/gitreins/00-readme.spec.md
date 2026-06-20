# speclang-header lines:12
id: "@gitreins/00-readme"
version: 1.0.0
layer: 0
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, index]
depends_on: []
status: imported
short: "GitReins specification index — 11 specs for task lifecycle, agentic evaluator, guard manager, pipeline engine, MCP server, CLI, and bootstrap"
---

# GitReins Specifications

Reverse-engineered from the existing codebase. Every spec is grounded in actual code behavior, not design intent.

## Spec Index

### @block:01-architecture @kind:spec-ref
- **Spec:** [01-Architecture](01-Architecture.spec.md)
- **Title:** Architecture & Data Flow
- **Realized By:** —
- **Status:** Implemented

### @block:02-llm-interface @kind:spec-ref
- **Spec:** [02-LLM-Interface](02-LLM-Interface.spec.md)
- **Title:** LLM Interface
- **Realized By:** `engine/llm.py`
- **Status:** Implemented

### @block:03-agentic-evaluator @kind:spec-ref
- **Spec:** [03-Agentic-Evaluator](03-Agentic-Evaluator.spec.md)
- **Title:** Agentic Evaluator
- **Realized By:** `engine/evaluator.py`
- **Status:** Implemented

### @block:04-guard-manager @kind:spec-ref
- **Spec:** [04-Guard-Manager](04-Guard-Manager.spec.md)
- **Title:** Guard Manager
- **Realized By:** `engine/guard_manager.py`
- **Status:** Implemented

### @block:05-task-manager @kind:spec-ref
- **Spec:** [05-Task-Manager](05-Task-Manager.spec.md)
- **Title:** Task Manager
- **Realized By:** `engine/task_manager.py`
- **Status:** Implemented

### @block:06-pipeline-engine @kind:spec-ref
- **Spec:** [06-Pipeline-Engine](06-Pipeline-Engine.spec.md)
- **Title:** Pipeline Engine
- **Realized By:** `engine/pipeline.py`
- **Status:** Implemented

### @block:07-judge-orchestrator @kind:spec-ref
- **Spec:** [07-Judge-Orchestrator](07-Judge-Orchestrator.spec.md)
- **Title:** Judge Orchestrator
- **Realized By:** `engine/judge.py`
- **Status:** Implemented

### @block:08-mcp-server @kind:spec-ref
- **Spec:** [08-MCP-Server](08-MCP-Server.spec.md)
- **Title:** MCP Server
- **Realized By:** `gitreins_mcp/server.py`
- **Status:** Implemented

### @block:09-cli @kind:spec-ref
- **Spec:** [09-CLI](09-CLI.spec.md)
- **Title:** CLI
- **Realized By:** `gitreins/cli.py`
- **Status:** Implemented

### @block:10-install-bootstrap @kind:spec-ref
- **Spec:** [10-Install-Bootstrap](10-Install-Bootstrap.spec.md)
- **Title:** Install/Bootstrap
- **Realized By:** `gitreins/install`
- **Status:** Implemented

### @block:11-configuration @kind:spec-ref
- **Spec:** [11-Configuration](11-Configuration.spec.md)
- **Title:** Configuration Schema
- **Realized By:** `.gitreins/config.yaml`
- **Status:** Implemented

## Traceability

All specs link to their realized-by implementation files. The [01-Architecture](01-Architecture.spec.md) spec defines the component dependency graph and data flow.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/00-README.md
