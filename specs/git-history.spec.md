# speclang-header lines:13
id: "@speclang/git-history"
version: 0.1.0
layer: 0
tags: [git, history, commits, traceability]
imports: ["@speclang/core"]
children: ["@speclang/git-history/commits", "@speclang/git-history/rollback"]
status: draft

project_level: Alpha
agent_support: agent_assisted
short: Git History
---

# Git History

Per-file commits for perfect traceability. Every change is tracked.

## Overview

```speclang
# @block:git/overview @kind:note
Every agent write = one git commit.

Benefits:
- Perfect cherry-pick capability
- Clear history of what changed
- Easy rollback per file
- Blame shows which agent did what
- Models can query history for context
```

---

## Sub-specs

This spec has been split into focused sub-specs for better organization:

### @ref:specs/git-history/commits
- Per-file commits and commit messages
- History tool, blame, cherry-pick, bisect
- Branch strategy and audit trail

### @ref:specs/git-history/rollback
- Rollback strategies and tools

Each sub-spec provides detailed, focused content while maintaining reference links back to this parent spec.