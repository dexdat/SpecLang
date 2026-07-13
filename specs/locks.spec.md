# speclang-header lines:10
id: "@speclang/locks"
version: 0.1.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [locks, file-locking, concurrency]
parent: "@ref:northstarpart: 1/1
short: "File locking system for spec cascade concurrency control"
---
# Locks System

The locks system prevents concurrent modifications to spec files during reactive cascades. Locks are stored in `.speclang/locks/` and logged for convergence detection.

## Sub‑Specs

- "@ref:speclang/locks/types – Lock types and structures
- @ref:speclang/locks/management – Acquisition, release, and management

## @block:locks-overview @kind:note
Locks ensure only one agent modifies a spec file at a time during cascades. They are automatically acquired before file writes and released after commits.

## @block:locks-directory @kind:entity
Lock files are stored in `.speclang/locks/`:

- `<lock_id>.lock` – JSON lock metadata
- `locks.log` – Audit log of acquisitions/releases
- `stale/` – Archived stale locks (optional)

## @block:locks-integration @kind:note
Locks integrate with:
- Convergence detection (lock activity signals cascade progress)
- Daemon process (PID tracking)
- Tool handlers (LocksToolHandler)

