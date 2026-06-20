# speclang-header lines:11
id: "@gitreins/09-cli"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, cli]
status: imported
short: "CLI — command-line interface for GitReins with init, guard, task, pipeline, and status commands"
realized_by: gitreins-poc/gitreins/cli.py
---

## 1. Overview

The CLI provides a human-usable command-line interface to GitReins. It wraps the engine modules and exposes task lifecycle, guard execution, judge evaluation, commit, and MCP server commands.

### @block:cli/REQ-CLI-001 @kind:requirement

**REQ-CLI-001: Command Structure**

The CLI MUST expose a hierarchical command structure:

```
gitreins task create <id> <title> [criteria...]
gitreins task start <id>
gitreins task complete <id>
gitreins task list [--status pending|in_progress|complete]
gitreins task delete <id>
gitreins guard run
gitreins judge <id>
gitreins commit <message>
gitreins mcp-server
```

**Realized by:** `gitreins/cli.py:145-218`.

### @block:cli/REQ-CLI-002 @kind:requirement

**REQ-CLI-002: Workdir Detection**

The CLI MUST auto-detect the git repo root using `git rev-parse --show-toplevel`. Falls back to `os.getcwd()` if git is unavailable.

**Realized by:** `gitreins/cli.py:23-33` — `get_workdir()`.

### @block:cli/REQ-CLI-003 @kind:requirement

**REQ-CLI-003: Task Creation**

`task create` MUST create a task via `TaskManager.create()` and print the created task with criteria.

**Realized by:** `gitreins/cli.py:36-43` — `cmd_task_create()`.

### @block:cli/REQ-CLI-004 @kind:requirement

**REQ-CLI-004: Task Start/Complete**

`task start` MUST mark a task as in_progress. `task complete` MUST mark it as complete AND run the judge evaluation, printing the full summary.

**Realized by:** `gitreins/cli.py:46-67`.

### @block:cli/REQ-CLI-005 @kind:requirement

**REQ-CLI-005: Task Listing**

`task list` MUST display tasks with status icons: ○ pending, ◐ in_progress, ● complete. Optional `--status` filter.

**Realized by:** `gitreins/cli.py:70-79`.

### @block:cli/REQ-CLI-006 @kind:requirement

**REQ-CLI-006: Guard Command**

`guard run` MUST execute `GuardManager.run_all()` and display pass/fail status with per-guard summary.

**Realized by:** `gitreins/cli.py:89-94`.

### @block:cli/REQ-CLI-007 @kind:requirement

**REQ-CLI-007: Judge Command**

`judge <id>` MUST find the task, create an `LLMClient` and `Judge`, run `evaluate_task()`, and print the summary. Exit code 1 if task not found.

**Realized by:** `gitreins/cli.py:97-113`.

### @block:cli/REQ-CLI-008 @kind:requirement

**REQ-CLI-008: Commit Command**

`commit <message>` MUST run guards first. If guards fail, print failure and exit with code 1. If guards pass, execute `git commit -m <message>` and display output.

**Realized by:** `gitreins/cli.py:115-134`.

### @block:cli/REQ-CLI-009 @kind:requirement

**REQ-CLI-009: MCP Server Command**

`mcp-server` MUST start the stdio MCP server. Path handling adds the repo root to `sys.path` to ensure imports work.

**Realized by:** `gitreins/cli.py:137-142`.

### @block:cli/REQ-CLI-010 @kind:requirement

**REQ-CLI-010: Logging**

Default log level is WARNING (only warnings+ shown). Format: `logger_name: LEVEL: message`. For diagnostics, set level through Python logging config.

**Realized by:** `gitreins/cli.py:186-190`.

### @block:cli/REQ-CLI-011 @kind:requirement

**REQ-CLI-011: Shebang**

The CLI file MUST be executable directly: `#!/usr/bin/env python3`.

**Realized by:** `gitreins/cli.py:1`.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/09-CLI.md impl=gitreins/cli.py
