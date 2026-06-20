# speclang-header lines:11
id: "@gitreins/10-install-bootstrap"
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_assisted
owned_by: gitreins
tags: [gitreins, install]
status: imported
short: "Install and Bootstrap — one-command setup with pre-commit hooks, config initialization, and dependency checks"
---

## 1. Overview

The install script activates GitReins in a repository with a single command. It creates the `.gitreins/` configuration directory, writes default config, and installs a pre-commit hook that enforces Tier 1 guards.

### @block:install/REQ-INST-001 @kind:requirement

**REQ-INST-001: One-Command Activation**

Running `./gitreins/install` from the repo root MUST fully activate GitReins in under 10 seconds.

**Realized by:** `gitreins/install` — entire script.

### @block:install/REQ-INST-002 @kind:requirement

**REQ-INST-002: Default Configuration**

The install script MUST create `.gitreins/config.yaml` with default settings if it doesn't already exist:

```yaml
guards:
  secrets: true
  lint: true
  tests: true
  test_command: "pytest -x --tb=short"
evaluator:
  max_iterations: 15
```

**Realized by:** `gitreins/install:20-36`.

### @block:install/REQ-INST-003 @kind:requirement

**REQ-INST-003: Pre-Commit Hook Installation**

The install script MUST create `.git/hooks/pre-commit` that:
1. Finds the repo root via `git rev-parse --show-toplevel`
2. Changes to the repo root directory
3. Runs `GuardManager.run_all()` via inline Python
4. Exits with code 1 if guards fail, printing the summary
5. Prints "Tier 1: PASS" on success

**Realized by:** `gitreins/install:39-65`.

### @block:install/REQ-INST-004 @kind:requirement

**REQ-INST-004: Hook Executable**

The installed hook MUST be executable (`chmod +x`).

**Realized by:** `gitreins/install:64`.

### @block:install/REQ-INST-005 @kind:requirement

**REQ-INST-005: Idempotent Installation**

Running install on an already-installed repo MUST be safe. The config file is only created if missing. The hook is overwritten.

**Realized by:** `gitreins/install:20-22` (conditional config), `39-65` (hook always written).

### @block:install/REQ-INST-006 @kind:requirement

**REQ-INST-006: Non-Git Repo Handling**

If `.git/hooks` directory is not found (not a git repo), the script MUST skip hook installation with a warning message rather than failing.

**Realized by:** `gitreins/install:66-68`.

### @block:install/REQ-INST-007 @kind:requirement

**REQ-INST-007: Post-Install Help Text**

The script MUST print example usage after installation:
- How to create a task via CLI
- How to start the MCP server

**Realized by:** `gitreins/install:70-76`.

### @block:install/REQ-INST-008 @kind:requirement

**REQ-INST-008: Config Directory Creation**

The `.gitreins/` directory MUST be created if it doesn't exist, with `mkdir -p`.

**Realized by:** `gitreins/install:17`.

### @block:install/REQ-INST-009 @kind:requirement

**REQ-INST-009: Error Handling**

The script MUST use `set -e` for fail-fast behavior. Shell errors stop execution immediately.

**Realized by:** `gitreins/install:5`.

axiom:trace work_item=SPEC-EXTRACT-001 spec=specs/10-Install-Bootstrap.md impl=gitreins/install
