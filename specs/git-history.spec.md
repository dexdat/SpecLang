# speclang-header lines:12
id: "@speclang/git-history"
version: 0.1.0
layer: 0
tags: [git, history, commits, traceability]
imports: ["@speclang/core"]
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

## Per-File Commits

### @git/per-file

```speclang
# @block:git/per-file @kind:entity
CommitStrategy:
  when: after each agent finishes
  what: only the file(s) that agent wrote
  
  format:
    git commit --only <file> -m "speclang: {agent_summary}"
    
  example:
    git commit --only specs/auth.scl -m "speclang: added auth entities"
    git commit --only generated/go/auth.go -m "speclang: generated auth handler"
    git commit --only tests/auth.test.spec.scl -m "speclang: added login tests"
```

### @git/commit-flow

```speclang
# @block:git/commit-flow @kind:diagram
```mermaid
sequenceDiagram
    A as Agent
    F as File
    G as Git
    
    A->>F: write specs/auth.scl
    A->>A: generate summary
    A->>G: commit --only specs/auth.scl
    G-->>A: commit_hash_1
    
    A->>F: write generated/go/auth.go
    A->>G: commit --only generated/go/auth.go
    G-->>A: commit_hash_2
```
```

---

## Commit Messages

### @git/messages

```speclang
# @block:git/messages @kind:entity
CommitMessage:
  format: speclang: {summary}
  
  source: agent's output summary
  
  examples:
    - "speclang: added auth entities to specs/auth.scl"
    - "speclang: expanded auth/login operation"
    - "speclang: generated handler.go from auth spec"
    - "speclang: added test for login failure case"
    - "speclang: auto-split auth.spec.yaml into 3 parts"
```

---

## History Tool

### @git/tool

```speclang
# @block:git/tool @kind:entity
speclang_git_history:
  description: "Get git history for a file"
  
  params:
    path: String
    limit: Integer (default: 20)
    
  returns:
    commits:
      - hash: String
        message: String
        author: String (agent name)
        timestamp: Integer
        diff_summary: String
        
  usage:
    # Model asks "what changed in auth.scl?"
    result = speclang_git_history("specs/auth.scl", limit=5)
```

### @git/tool-example

```speclang
# @block:git/tool-example @kind:code
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
```

---

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

---

## Blame

### @git/blame

```speclang
# @block:git/blame @kind:entity
GitBlame:
  description: "See which agent wrote each line"
  
  tool:
    speclang_blame:
      params: { path, line_range? }
      returns:
        - line: Integer
          content: String
          commit: String
          author: String (agent name)
          timestamp: Integer
          
  use_case:
    - "Who added this rate limiting logic?"
    - "When was this entity defined?"
    - "Which agent made this change?"
```

---

## Cherry-Pick

### @git/cherry-pick

```speclang
# @block:git/cherry-pick @kind:entity
CherryPick:
  description: "Apply specific commits to other branches"
  
  workflow:
    1. Create feature branch
    2. Cherry-pick specific commits
    3. Test
    4. Merge
    
  example:
    git checkout feature-branch
    git cherry-pick a1b2c3d  # the auth entity commit
    git cherry-pick e4f5g6h  # the auth handler commit
    
  benefit: selectively apply changes from swarm
```

---

## Bisect

### @git/bisect

```speclang
# @block:git/bisect @kind:entity
GitBisect:
  description: "Find which commit introduced a bug"
  
  workflow:
    1. Mark known good commit
    2. Mark known bad commit
    3. Git bisects automatically
    4. Each commit is a single file change
    5. Easy to identify problem
    
  tool:
    speclang_bisect:
      params: { good_commit, bad_commit, test_command }
      returns: { culprit_commit, file, agent }
```

---

## History for Context

### @git/context

```speclang
# @block:git/context @kind:note
Models use git history for context:

- "What changed recently in this file?"
- "Who wrote this function?"
- "When was this entity added?"
- "What's the evolution of this spec?"

This provides context without reading full file history.
```

---

## Branch Strategy

### @git/branches

```speclang
# @block:git/branches @kind:entity
BranchStrategy:
  main:
    - converged, tested specs and code
    - always deployable
    
  feature/*:
    - active development
    - cascade in progress
    - not converged
    
  worktree/*:
    - isolated test versions
    - parallel testing
    
  merging:
    - only converged branches to main
    - each merge = one cascade completion
```

---

## Audit Trail

### @git/audit

```speclang
# @block:git/audit @kind:entity
AuditTrail:
  what_is_logged:
    - every agent action
    - every file change
    - every commit
    - every rollback
    
  compliance:
    - SOC2: complete change history
    - GDPR: data lineage
    - ISO27001: audit trail
    
  export:
    speclang_audit_export:
      params: { start_date, end_date, format }
      returns: audit log file
```
