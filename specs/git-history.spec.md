# speclang-header lines:12
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

# Git History - The System's Memory

Git as the memory system: every file edit = one git commit. Perfect traceability with commit hash-linked causality chains.

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

## Git as Memory System

```speclang
# @block:git/memory-system @kind:note
Git replaces traditional memory banks:

- Every change = git commit
- Commit messages = agent work summaries  
- Commit hashes link related changes
- Headers track causality chains
- History queryable via git tools
- No separate memory-bank needed

Benefits:
- Scales infinitely (git handles large histories)
- Built-in version control
- Branching for experimentation
- Full audit trail
- Models can use git blame/history for context
```

## Commit Hash-Linked Causality Chains

```speclang
# @block:git/causality @kind:entity
CausalitySystem:
  change_id: commit_hash (actual git commit hash)
  parent_change_id: commit_hash (commit that caused this change)
  chain: [change_id, parent_change_id, grandparent_change_id...]
  
  stored_in:
    - Commit message metadata: "[commit:{hash} parent:{parent_hash}]"
    - Spec headers (caused_by field): "@commit:{parent_hash}"
    - SQLite for querying
    
  reconstruction:
    - Follow chain to understand flow
    - Even if commits are out of order
    - Headers contain full context
    
  advantages_over_uuid:
    - Uses existing git infrastructure
    - No UUID generation needed
    - Direct link to actual commits
    - Immune to UUID corruption in commit messages
    - Can use git tools directly for tracing
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