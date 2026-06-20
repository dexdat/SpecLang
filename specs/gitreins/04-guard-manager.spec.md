# speclang-header lines:11
id: "@gitreins/04-guard-manager"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, guard]
status: imported
short: "Guard Manager — tiered pre-commit guard system with secrets scan, lint, test, and agentic evaluator"
---

# 04 — Guard Manager

> **Status:** Implemented  
> **Realized by:** `engine/guard_manager.py` (241 lines)  
> **Reverse-engineered:** 2026-06-09

## 1. Overview

The Guard Manager runs static checks at pre-commit and pre-eval time. Tier 1 (no LLM, fast). All checks are optional and configurable via `.gitreins/config.yaml`.

## Requirements

### @block:grd-001/three-guard-checks @kind:requirement

**REQ-GRD-001: Three Guard Checks**

The guard manager MUST support three guards, each individually configurable:

1. **Secrets** — Scan for secrets using gitleaks or built-in pattern scanner
2. **Lint** — Run linter (ruff or flake8) on staged Python files
3. **Tests** — Run tests via pytest

**Realized by:** `engine/guard_manager.py:43-69` — `GuardManager.__init__()` and `run_all()`.

### @block:grd-002/guard-configuration @kind:requirement

**REQ-GRD-002: Guard Configuration**

Each guard MUST be togglable via `.gitreins/config.yaml` under `guards.secrets`, `guards.lint`, `guards.tests` (boolean). The `guards.test_command` key allows customizing the test command (default: `pytest -x --tb=short`).

**Realized by:** `engine/guard_manager.py:46-53`.

### @block:grd-003/two-tier-secrets-scanning @kind:requirement

**REQ-GRD-003: Two-Tier Secrets Scanning**

The secrets guard MUST try gitleaks first (`gitleaks detect --source . --no-git --verbose`). If gitleaks is not found or fails, it MUST fall back to the built-in pattern scanner.

**Realized by:** `engine/guard_manager.py:71-89`.

### @block:grd-004/built-in-secrets-scanner @kind:requirement

**REQ-GRD-004: Built-in Secrets Scanner**

The built-in scanner MUST detect these patterns:

- Hardcoded API keys (literal values assigned to api_key/apikey)
- Private key blocks (BEGIN RSA/DSA/EC/OPENSSH/PGP PRIVATE KEY)
- GitHub tokens (ghp_, gho_)
- GitLab tokens (glpat-)
- OpenAI keys (sk-)
- AWS access keys (AKIA)
- Hardcoded JWTs (literal token=jwt assignments)
- Hardcoded passwords (literal password=... assignments)
- Generic high-entropy secrets/tokens

**Realized by:** `engine/guard_manager.py:100-120` — `danger_patterns`.

### @block:grd-005/secrets-whitelist @kind:requirement

**REQ-GRD-005: Secrets Whitelist**

The scanner MUST ignore these false-positive patterns:

- Environment variable access (`os.getenv`, `os.environ`, `environ[`, etc.)
- Shell variable substitution (`${VAR}`)
- Template variables (`{{...}}`)
- Empty passwords (`PASSWORD = ""`)
- Placeholders (EXAMPLE, PLACEHOLDER, TODO, FIXME, xxx)
- JWT construction calls (jwt.encode, jwt.decode)
- Generated/random/hash/uuid values

**Realized by:** `engine/guard_manager.py:123-132` — `whitelist_patterns`.

### @block:grd-006/secrets-output-sanitization @kind:requirement

**REQ-GRD-006: Secrets Output Sanitization**

Finding output MUST suppress the actual secret value by replacing `"..."` content with `"***"`.

**Realized by:** `engine/guard_manager.py:168`.

### @block:grd-007/only-staged-files-scanned @kind:requirement

**REQ-GRD-007: Only Staged Files Scanned**

The secrets scan MUST only inspect files listed by `git diff --cached --name-only --diff-filter=ACM`. Files larger than 1MB are skipped.

**Realized by:** `engine/guard_manager.py:135-151`.

### @block:grd-008/lint-graceful-fallback @kind:requirement

**REQ-GRD-008: Lint Graceful Fallback**

The lint guard MUST try `ruff check <files>` first, then `flake8 <files>`. If neither is available, it MUST return passed with "No linter found — skipped".

**Realized by:** `engine/guard_manager.py:185-216`.

### @block:grd-009/test-graceful-fallback @kind:requirement

**REQ-GRD-009: Test Graceful Fallback**

The test guard MUST check for pytest availability (`pytest --version`). If not available, returns passed with "pytest not found — skipped". Test timeout is 120 seconds.

**Realized by:** `engine/guard_manager.py:218-241`.

### @block:grd-010/guardresult-data-type @kind:requirement

**REQ-GRD-010: GuardResult Data Type**

Each guard MUST return a `GuardResult` dataclass with fields: `name: str`, `passed: bool`, `output: str`, `error: str`.

**Realized by:** `engine/guard_manager.py:20-27`.

### @block:grd-011/tier1result-aggregate @kind:requirement

**REQ-GRD-011: Tier1Result Aggregate**

`run_all()` MUST return a `Tier1Result` with `passed: bool` and `results: list[GuardResult]`, with a `summary` property for formatted output.

**Realized by:** `engine/guard_manager.py:29-69`.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/04-Guard-Manager.md impl=engine/guard_manager.py
