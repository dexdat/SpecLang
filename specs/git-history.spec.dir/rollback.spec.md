# speclang-header lines:12
id: "@speclang/git-history/rollback"
version: 0.1.0
layer: 2
tags: [git, history, rollback, revert]
imports: ["@speclang/git-history"]
parent: "@ref:specs/git-history"
part: 2/2
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Git Rollback
---

# Git Rollback

## Rollback

### @git/rollback

```speclang
# @block:git/rollback @kind:entity
RollbackStrategy:
  per_file:
    command: git checkout HEAD~1 -- <file>
    effect: revert single file to previous version
    
  per_agent:
    command: git revert <commit_hash>
    effect: revert all files from that commit
    
  cascade:
    command: git reset --hard <commit_hash>
    effect: revert entire cascade
    
  tool:
    speclang_rollback:
      params: { file?, commit_hash? }
      returns: { reverted: [], current_hash }
```