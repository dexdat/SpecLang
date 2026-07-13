# speclang-header lines:12
id: "@speclang/workflow/examples"
version: 0.1.0
layer: 2
parent: "speclang/workflow"

tags: [workflow, examples, file-flow, team, troubleshooting]
status: draft
project_level: Alpha
agent_support: agent_assisted
short: Workflow Examples and Diagrams
---

## The File Flow

### @workflow/file-flow

```speclang
# @block:workflow/file-flow @kind:diagram
```mermaid
flowchart TD
    subgraph User
        T[Talk to AI] --> NS[project.scl]
    end
    
    subgraph Level0
        NS --> |AI edits| NS
    end
    
    subgraph Level1to9
        NS --> S1[specs/auth.scl]
        NS --> S2[specs/todos.scl]
        S1 --> S3[specs/auth/entities.scl]
        S1 --> S4[specs/auth/operations.scl]
    end
    
    subgraph Level10
        S3 --> M1[auth.go.spec]
        S4 --> M2[handler.go.spec]
    end
    
    subgraph Generated
        M1 --> G1[generated/auth.go]
        M2 --> G2[generated/handler.go]
    end
    
    subgraph Tests
        G1 --> T1[auth.test.spec.scl]
        G1 --> T2[auth_test.go]
    end
    
    subgraph User2
        R[Review NS + specs/]
    end
    
    NS -.-> R
    S1 -.-> R
```
```

---

## Team Workflow

### @workflow/team

```speclang
# @block:workflow/team @kind:entity
TeamWorkflow:
  git_integration:
    - Specs are version controlled
    - Each convergence = commit
    - PRs review specs, not code
    
  collaboration:
    - Multiple developers = multiple cascades
    - File locks prevent conflicts
    - North star is shared intent
  
  review_process:
    - PR contains spec changes
    - Reviewer checks specs
    - Approve → merge → cascade on main
    - Generated code auto-committed
```

---

## Troubleshooting

### @workflow/troubleshooting

```speclang
# @block:workflow/troubleshooting @kind:entity
CommonIssues:
  
  cascade_stuck:
    symptom: No progress, files not changing
    fix: /status, check agent logs, /resume
    
  tests_failing:
    symptom: Pipeline fails on tests
    fix: AI auto-rolled back, check notification, fix spec
    
  conflict:
    symptom: Two agents want same file
    fix: Daemon serializes, may pause, check locks/
    
  wrong_output:
    symptom: Generated code doesn't match intent
    fix: Update spec, not code. Code regenerates.
```