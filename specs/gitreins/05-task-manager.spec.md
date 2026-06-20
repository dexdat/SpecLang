# speclang-header lines:11
id: "@gitreins/05-task-manager"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, task]
status: draft
short: "Task Manager — YAML-backed task lifecycle management with create/start/complete states"
---

# 05 — Task Manager

> **Status:** Implemented  
> **Realized by:** `engine/task_manager.py` (149 lines)  
> **Reverse-engineered:** 2026-06-09

## 1. Overview

The Task Manager provides YAML-backed task lifecycle management. Tasks are stored in `.gitreins/tasks.yaml` inside the repo with id, title, criteria, status, and timestamps.

## Requirements

### @block:task/storage-format @kind:requirement

Tasks MUST be stored in `.gitreins/tasks.yaml` in YAML format:

```yaml
tasks:
  - id: "login-endpoint"
    title: "Implement POST /login endpoint"
    criteria:
      - "Accepts email+password as JSON body"
      - "Returns JWT token on success"
      - "Returns 401 on invalid credentials"
      - "Has tests for happy path and error cases"
    status: pending
    created_at: "2026-06-09T12:00:00+00:00"
    completed_at: null
```

**Realized by:** `engine/task_manager.py:4-16` (docstring schema), `37-83` (load/save).

### @block:task/data-model @kind:requirement

The `Task` dataclass MUST have fields: `id: str`, `title: str`, `criteria: list[str]`, `status: str` (pending|in_progress|complete), `created_at: str`, `completed_at: str | None`.

**Realized by:** `engine/task_manager.py:27-35`.

### @block:task/lifecycle-states @kind:requirement

Tasks MUST transition through three states:
- `pending` — created but not started
- `in_progress` — actively being worked on
- `complete` — finished (triggers evaluation)

**Realized by:** `engine/task_manager.py:85-116` — `create()`, `start()`, `complete()`.

### @block:task/atomic-persistence @kind:requirement

Every mutation (`create`, `start`, `complete`, `delete`) MUST immediately write to disk via `_save()`. The config directory is auto-created if missing.

**Realized by:** `engine/task_manager.py:67-83`, `98, 105, 116, 138`.

### @block:task/timestamps @kind:requirement

- `created_at` MUST be set at creation time (UTC ISO format)
- `completed_at` MUST be set at completion time (UTC ISO format)
- `completed_at` is `None` until completion

**Realized by:** `engine/task_manager.py:87`, `114`.

### @block:task/crud-operations @kind:requirement

The manager MUST support: create, get (by ID), list (all, optionally filtered by status), delete (by ID). `all_tasks()` returns all tasks regardless of status.

**Realized by:** `engine/task_manager.py:85-148`.

### @block:task/error-handling @kind:requirement

- Create with duplicate ID: overwrites silently (last write wins)
- Get with missing ID: returns `None`
- Delete with missing ID: raises `KeyError`
- Start/complete with missing ID: raises `KeyError`
- Failed file I/O: prints warning, program continues with in-memory state

**Realized by:** `engine/task_manager.py:64-65`, `100-106`, `109-116`, `133-138`.

### @block:task/mcp-serialization @kind:requirement

Tasks MUST serialize to plain dicts for MCP/JSON transport via `to_dict()`.

**Realized by:** `engine/task_manager.py:140-149`.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/05-Task-Manager.md impl=engine/task_manager.py
