# speclang-header lines:10
id: "@speclang/opencode-plugin-spec-dir/checklist"
version: 0.2.0
layer: 5
imports: ["@speclang/opencode-plugin.spec.dir/overview"]
tags: [opencode, plugin, checklist, implementation]
short: Implementation checklist for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Implementation Checklist

## Core Features

- [x] Event listeners for file.edited, agent.finished, session.idle
- [x] Ownership guard with lock expiration
- [x] Session management with timeout
- [x] Spec indexing and SQLite storage
- [ ] MCP client integration
- [x] Git integration with per-file commits
- [x] Convergence detection and pipeline
- [x] Configuration management
- [x] Tool definitions for OpenCode
- [ ] Error handling and recovery

## Database Schema

- [x] specs table
- [x] sessions table
- [x] events table
- [x] file_locks table
- [x] FTS virtual table
- [x] migrations system

## Testing

- [ ] Unit tests for each component
- [ ] Integration tests with OpenCode simulator
- [ ] End-to-end cascade simulation

## Deployment

- [ ] Package as OpenCode plugin
- [ ] Documentation
- [ ] Example configuration

## References

- "@ref:speclang/opencode-plugin.spec.dir/* (individual components)