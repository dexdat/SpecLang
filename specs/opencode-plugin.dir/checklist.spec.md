# speclang-header lines:12
id: "@speclang/opencode-plugin.dir/checklist"
version: 0.1.0
layer: 5
imports: ["@speclang/opencode-plugin.dir/overview"]
tags: [opencode, plugin, checklist, implementation]
short: Implementation checklist for OpenCode Speclang plugin
project_level: Alpha
agent_support: agent_assisted
---
# Implementation Checklist

## Core Features

- [x] Event listeners for file.edited, agent.finished, session.idle
- [ ] Ownership guard with lock expiration
- [ ] Session management with timeout
- [ ] Spec indexing and SQLite storage
- [ ] MCP client integration
- [ ] Git integration with per-file commits
- [ ] Convergence detection and pipeline
- [ ] Configuration management
- [ ] Tool definitions for OpenCode
- [ ] Error handling and recovery

## Database Schema

- [x] specs table
- [x] sessions table
- [x] events table
- [x] file_locks table
- [x] FTS virtual table
- [ ] migrations system

## Testing

- [ ] Unit tests for each component
- [ ] Integration tests with OpenCode simulator
- [ ] End-to-end cascade simulation

## Deployment

- [ ] Package as OpenCode plugin
- [ ] Documentation
- [ ] Example configuration

## References

- @ref:speclang/opencode-plugin.dir/* (individual components)