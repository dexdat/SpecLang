# speclang-header lines:12
id: "@speclang/roadmap/mvp/file-ownership"
parent: "@ref:speclang/roadmap/mvp"
version: 0.1.0
layer: 2
project_level: MVP
agent_support: agent_assisted
status: draft
tags: [roadmap, mvp, ownership, locks]
imports: ["@speclang/ownership", "@speclang/agent-protocol"]
short: MVP single-agent file ownership and guarded ownership transfer
---

# MVP: File Ownership

## Scope

Extracts P1-011 from @ref:speclang/roadmap/mvp as a draft requirement.

## Requirements

### @block::ownership @kind:policy

- At most one agent owns a file at a time.
- Store file locks in SQLite and reject unauthorized edits.
- Transfer ownership through the ownership protocol rather than overwriting a lock.
- Verify ownership in pre-commit hooks and track violations.

## Acceptance Criteria

- When Code Gen owns src/hello.ts, another agent's edit is blocked and logged.
- An authorized ownership transfer removes the prior agent's edit permission.
- Concurrent ownership requests never result in two owners for one file.
- The MVP target of zero unauthorized edits means edits are blocked, not that
  violation records are hidden.
