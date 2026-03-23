---
name: sip-030-git-history-speclang-v0
title: "SIP 30: Git Integration"
version: 0.1.0
description: Per-file commits for perfect traceability
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 30: Git Integration

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Git Integration—per-file commits for perfect traceability.

### Quick Start

Git workflow:
1. **Per-file commits**: Each agent write = one commit
2. **Standard format**: `speclang: {summary}`
3. **History tool**: Query file history for context
4. **Rollback**: Easy per-file or per-agent revert

### When to Read This

- **Understanding history:** What changed when
- **Building rollback:** How to revert changes
- **Audit requirements:** SOC2, GDPR compliance

### Related SIPs

- SIP 6: Agent Protocol
- SIP 29: Agent Tools API
- SIP 28: Cascade Protocol

## Abstract

This SIP defines Git Integration—per-file commit strategy that provides perfect traceability for every change. Each agent write creates one commit, enabling cherry-pick capability, clear history, easy rollback, and complete audit trails.

## Motivation

Traditional commits bundle many changes:
- Hard to isolate specific changes
- Difficult to cherry-pick features
- Unclear which agent did what
- Rollback affects unrelated changes

Per-file commits provide:
- Perfect cherry-pick capability
- Clear history of what changed
- Easy rollback per file
- Blame shows which agent did what
- Models can query history for context

## Rationale

**Per-file > Bundled:**

1. **Traceable**: Each change isolated
2. **Reversible**: Single-file rollback
3. **Accountable**: Agent attribution
4. **Queryable**: History as context

This matches micro-commit best practices.

## Specification

### Per-File Commit Strategy

```yaml
CommitStrategy:
  when: "after each agent finishes"
  what: "only the file(s) that agent wrote"
  
  format:
    command: "git commit --only <file> -m \"speclang: {agent_summary}\""
    
  examples:
    - "git commit --only specs/auth.scl -m \"speclang: added auth entities\""
    - "git commit --only generated/go/auth.go -m \"speclang: generated auth handler\""
    - "git commit --only tests/auth.test.spec.scl -m \"speclang: added login tests\""
```

### Commit Flow

```yaml
CommitFlow:
  sequence:
    1_agent_write:
      action: "Agent writes file"
      example: "specs/auth.scl"
      
    2_summary:
      action: "Agent generates summary"
      source: "Agent's output"
      
    3_commit:
      action: "Create commit"
      command: "git commit --only specs/auth.scl"
      
    4_hash:
      action: "Return commit hash"
      example: "a1b2c3d"
```

### Commit Messages

```yaml
CommitMessage:
  format: "speclang: {summary}"
  source: "agent's output summary"
  
  examples:
    - "speclang: added auth entities to specs/auth.scl"
    - "speclang: expanded auth/login operation"
    - "speclang: generated handler.go from auth spec"
    - "speclang: added test for login failure case"
    - "speclang: auto-split auth.spec.yaml into 3 parts"
```

### History Tool

```yaml
speclang_git_history:
  description: "Get git history for a file"
  
  params:
    path: String
    limit: Integer (default: 20)
    
  returns:
    commits:
      - hash: String
        message: String
        author: String
        timestamp: Integer
        diff_summary: String
        
  usage:
    scenario: "Model asks what changed in auth.scl"
    call: 'speclang_git_history("specs/auth.scl", limit=5)'
```

### Rollback Strategy

```yaml
RollbackStrategy:
  per_file:
    command: "git checkout HEAD~1 -- <file>"
    effect: "revert single file to previous version"
    
  per_agent:
    command: "git revert <commit_hash>"
    effect: "revert all files from that commit"
    
  cascade:
    command: "git reset --hard <commit_hash>"
    effect: "revert entire cascade"
    
  tool:
    speclang_rollback:
      params: { file?: String, commit_hash?: String }
      returns: { reverted: [], current_hash }
```

### Blame

```yaml
GitBlame:
  description: "See which agent wrote each line"
  
  tool:
    speclang_blame:
      params:
        path: String
        line_range?: String
      returns:
        - line: Integer
          content: String
          commit: String
          author: String
          timestamp: Integer
          
  use_cases:
    - "Who added this rate limiting logic?"
    - "When was this entity defined?"
    - "Which agent made this change?"
```

### Cherry-Pick

```yaml
CherryPick:
  description: "Apply specific commits to other branches"
  
  workflow:
    1: "Create feature branch"
    2: "Cherry-pick specific commits"
    3: "Test"
    4: "Merge"
    
  example:
    - "git checkout feature-branch"
    - "git cherry-pick a1b2c3d  # the auth entity commit"
    - "git cherry-pick e4f5g6h  # the auth handler commit"
    
  benefit: "selectively apply changes from swarm"
```

### Bisect

```yaml
GitBisect:
  description: "Find which commit introduced a bug"
  
  workflow:
    1: "Mark known good commit"
    2: "Mark known bad commit"
    3: "Git bisects automatically"
    4: "Each commit is a single file change"
    5: "Easy to identify problem"
    
  tool:
    speclang_bisect:
      params:
        good_commit: String
        bad_commit: String
        test_command: String
      returns:
        culprit_commit: String
        file: String
        agent: String
```

### Branch Strategy

```yaml
BranchStrategy:
  main:
    contents: "converged, tested specs and code"
    constraint: "always deployable"
    
  feature/*:
    contents: "active development, cascade in progress"
    constraint: "not converged"
    
  worktree/*:
    contents: "isolated test versions, parallel testing"
    constraint: "temporary"
    
  merging:
    rule: "only converged branches to main"
    unit: "each merge = one cascade completion"
```

### Audit Trail

```yaml
AuditTrail:
  what_is_logged:
    - every agent action
    - every file change
    - every commit
    - every rollback
    
  compliance:
    SOC2: "complete change history"
    GDPR: "data lineage"
    ISO27001: "audit trail"
    
  export:
    speclang_audit_export:
      params:
        start_date: String
        end_date: String
        format: String
      returns: "audit log file"
```

## Examples

### Example 1: History Query Result

```json
{
  "path": "specs/auth.scl",
  "commits": [
    {
      "hash": "a1b2c3d",
      "message": "speclang: added rate limiting to login",
      "author": "spec-writer",
      "timestamp": 1705312200,
      "diff_summary": "+15 lines, -3 lines"
    },
    {
      "hash": "e4f5g6h",
      "message": "speclang: expanded auth entities",
      "author": "spec-writer", 
      "timestamp": 1705312100,
      "diff_summary": "+42 lines, new file"
    }
  ]
}
```

### Example 2: Blame Query

```yaml
tool: speclang_blame
params: { path: "specs/auth.scl", line_range: "45-50" }

result:
  - line: 45
    content: "  rate_limit: 100/minute"
    commit: "a1b2c3d"
    author: "spec-writer"
    timestamp: 1705312200
  - line: 46
    content: "  timeout: 30s"
    commit: "e4f5g6h"
    author: "spec-writer"
    timestamp: 1705312100
```

### Example 3: Cascade Rollback

```yaml
scenario: "Cascade introduced bug, need to revert"

current_state:
  commits:
    - hash: "f7g8h9i"
      message: "speclang: generated payment handler"
      files: ["src/payment/handler.go"]
    - hash: "e4f5g6h"
      message: "speclang: added payment spec"
      files: ["specs/payment.spec.md"]

rollback:
  per_file:
    command: "git checkout HEAD~1 -- src/payment/handler.go"
    result: "Handler reverted, spec kept"
    
  per_commit:
    command: "git revert f7g8h9i"
    result: "Handler commit reverted"
    
  cascade:
    command: "git reset --hard e4f5g6h"
    result: "All payment changes removed"
```

## Implementation

```python
class GitHistory:
    def __init__(self, repo_path: str):
        self.repo = git.Repo(repo_path)
        
    def commit_file(self, path: str, message: str) -> str:
        self.repo.index.add([path])
        commit = self.repo.index.commit(f"speclang: {message}")
        return commit.hexsha[:7]
        
    def get_history(self, path: str, limit: int = 20) -> list:
        commits = []
        for commit in list(self.repo.iter_commits(paths=path))[:limit]:
            commits.append({
                "hash": commit.hexsha[:7],
                "message": commit.message.strip(),
                "author": commit.author.name,
                "timestamp": commit.committed_date,
                "diff_summary": self._summarize_diff(commit, path)
            })
        return commits
        
    def rollback_file(self, path: str, commits_back: int = 1) -> dict:
        target = f"HEAD~{commits_back}"
        self.repo.git.checkout(target, "--", path)
        return {"reverted": [path], "current_hash": self.repo.head.commit.hexsha[:7]}
```

## References

- "@ref:speclang/git-history
- @ref:speclang/tools
- SIP 29: Agent Tools API

## Copyright

This document is in the public domain.
