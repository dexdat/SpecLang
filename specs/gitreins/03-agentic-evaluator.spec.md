---
id: "@gitreins/03-agentic-evaluator"
version: 1.0.0
layer: 2
owned-by: gitreins
tags: [gitreins, evaluator]
short: "Agentic Evaluator — LLM-driven verification of task outputs against acceptance criteria"
depends_on:
  - "@ref:gitreins/01-architecture"
status: imported
realized_by: gitreins-poc/engine/evaluator.py
---

# 03 — Agentic Evaluator

> **Status:** Imported  
> **Realized by:** `engine/evaluator.py` (572 lines)  
> **Reverse-engineered:** 2026-06-09

## 1. Overview

The AgenticEvaluator is an LLM-powered iterative loop that judges whether a completed task meets ALL of its defined criteria. It is not a single LLM call — the LLM iterates, calling tools and incorporating results, until it has enough evidence to deliver a verdict.

## Requirements

### @block:eval/iterative-agentic-loop @kind:requirement

The evaluator MUST run an iterative loop where the LLM calls tools and receives results. The loop terminates when the LLM stops calling tools (it decided it has sufficient evidence) or when it hits the maximum iteration count (15 by default).

**Realized by:** `engine/evaluator.py:197-308` — `evaluate()`.

### @block:eval/seven-evaluation-tools @kind:requirement

The evaluator MUST expose exactly 7 tools to the LLM:

| # | Tool | Purpose |
|---|------|---------|
| 1 | `read_file(path, offset?, limit?)` | Read any file in the working tree |
| 2 | `run_command(cmd)` | Run a shell command (tests, lint, build) |
| 3 | `search_pattern(regex, file_glob?)` | Grep the codebase for a pattern |
| 4 | `read_diff()` | Show staged and unstaged git changes |
| 5 | `get_task_item(id)` | Read a task's full definition and criteria |
| 6 | `sandbox_write(key, content)` | Write to scratch space |
| 7 | `sandbox_read(key)` | Read from scratch space |

**Realized by:** `engine/evaluator.py:65-162` — `EVALUATOR_TOOLS`, implemented at lines 361-511.

### @block:eval/tool-deduplication @kind:requirement

The evaluator MUST track which files have been read, commands run, and searches performed. If the LLM attempts to repeat an operation, the tool MUST be executed but a `_dedup_warning` added to the result, instructing the LLM to move on.

**Realized by:** `engine/evaluator.py:192-195` (tracking sets), `310-336` (`_execute_tool_with_dedup`).

### @block:eval/structured-verdict-format @kind:requirement

The final verdict MUST be a JSON object with exact schema:

```json
{
  "verdict": "COMPLETE" | "INCOMPLETE",
  "items": [
    {
      "criterion": "<exact criterion text>",
      "status": "PASS" | "FAIL",
      "detail": "<specific file:line evidence or what's missing>"
    }
  ],
  "summary": "<one sentence>"
}
```

Every criterion from the task MUST have a corresponding item. PASS requires concrete evidence. FAIL requires explaining what's missing.

**Realized by:** `engine/evaluator.py:32-63` — system prompt, `513-572` — `_parse_verdict()`.

### @block:eval/robust-verdict-parsing @kind:requirement

The parser MUST handle three fallback strategies:

1. **Strip markdown fences:** Remove ` ```json ``` ` wrappers
2. **Extract JSON boundaries:** Find first `{` to last `}`, parse JSON
3. **Keyword fallback:** Check for `"complete"`, `all criteria...pass` patterns

Invalid verdicts/statuses default to INCOMPLETE/FAIL.

**Realized by:** `engine/evaluator.py:513-572`.

### @block:eval/maximum-iterations @kind:requirement

The loop MUST terminate after `max_iterations` (default 15, max configurable to 20). On reaching the limit, a final prompt is sent demanding a verdict. If the final call fails, returns INCOMPLETE.

**Realized by:** `engine/evaluator.py:188, 295-308`.

### @block:eval/path-safety @kind:requirement

The `read_file` tool MUST validate that the resolved path is within the workdir (using `os.path.realpath` comparison). It MUST NOT allow reading files outside the working tree.

**Realized by:** `engine/evaluator.py:363-411` — `_tool_read_file()`.

### @block:eval/large-file-handling @kind:requirement

For files over 12,000 characters, the tool MUST truncate to the first 400 lines unless `offset`/`limit` parameters are specified. The response includes `total_lines`, `total_chars`, `shown_lines`, and `has_more` metadata.

**Realized by:** `engine/evaluator.py:397-409`.

### @block:eval/command-execution @kind:requirement

The `run_command` tool MUST execute shell commands with a 30-second timeout, capture stdout+stderr, and truncate output to 4,000 characters. It must run in the workdir context.

**Realized by:** `engine/evaluator.py:413-435`.

### @block:eval/pattern-search-safety @kind:requirement

The `search_pattern` tool MUST skip directories: `.git`, `venv`, `.venv`, `node_modules`, `__pycache__`, `.gitreins-sandbox`, `.pytest_cache`. It MUST skip files larger than 500KB. Results capped at 200 matches.

**Realized by:** `engine/evaluator.py:437-472`.

### @block:eval/llm-error-handling @kind:requirement

If an LLM call fails mid-loop, the evaluator MUST return an INCOMPLETE verdict with an error summary rather than crashing.

**Realized by:** `engine/evaluator.py:240-245`.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/03-Agentic-Evaluator.md impl=engine/evaluator.py
