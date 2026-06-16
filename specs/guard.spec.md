# speclang-header lines:9
id: "@specs/guard"
version: 1.0.0
layer: 2
project_level: Alpha
agent_support: agent_assisted
target: src/guard/
tags: [guard, ownership, security]
short: Agent ownership and write access guard system
---

# Guard System

The Guard System enforces file ownership rules to prevent agents from writing to files they don't own.

## Overview

- **OwnershipRegistry**: Manages ownership rules and pattern matching
- **WriteInterceptor**: Intercepts file operations and enforces rules
- **ViolationTracker**: Tracks all policy violations

## Details

See `specs/guard.spec.dir/index.spec.md` for full specification.
