# speclang-header lines:24
id: "@speclang/opencode-plugin"
version: 0.2.0
layer: 3
imports: ["@speclang/core", "@speclang/agent-protocol", "@speclang/sqlite", "@speclang/mcp"]
tags: [opencode, plugin, typescript, implementation]
children:
    - "@ref:specs/opencode-plugin.spec.dir/overview"
    - "@ref:specs/opencode-plugin.spec.dir/architecture"
    - "@ref:specs/opencode-plugin.spec.dir/event-system"
    - "@ref:specs/opencode-plugin.spec.dir/session-manager"
    - "@ref:specs/opencode-plugin.spec.dir/ownership-guard"
    - "@ref:specs/opencode-plugin.spec.dir/mcp-client"
    - "@ref:specs/opencode-plugin.spec.dir/git-integration"
    - "@ref:specs/opencode-plugin.spec.dir/convergence"
    - "@ref:specs/opencode-plugin.spec.dir/configuration"
    - "@ref:specs/opencode-plugin.spec.dir/plugin-lifecycle"
    - "@ref:specs/opencode-plugin.spec.dir/tools"
    - "@ref:specs/opencode-plugin.spec.dir/error-handling"
    - "@ref:specs/opencode-plugin.spec.dir/checklist"
short: TypeScript OpenCode plugin for Speclang integration (split into parts)
project_level: Alpha
agent_support: agent_assisted
---
# OpenCode Plugin Implementation

TypeScript plugin for OpenCode that integrates Speclang reactive cascade system.

This spec has been split into multiple parts for better organization and autonomous agent operation.

## Parts

- "@ref:specs/opencode-plugin.spec.dir/overview - Overview and plugin lifecycle
- @ref:specs/opencode-plugin.spec.dir/architecture - Architecture diagram and components
- @ref:specs/opencode-plugin.spec.dir/event-system - Event system integration
- @ref:specs/opencode-plugin.spec.dir/session-manager - Session management
- @ref:specs/opencode-plugin.spec.dir/ownership-guard - Ownership guard
- @ref:specs/opencode-plugin.spec.dir/mcp-client - MCP client integration
- @ref:specs/opencode-plugin.spec.dir/git-integration - Git integration
- @ref:specs/opencode-plugin.spec.dir/convergence - Convergence detection
- @ref:specs/opencode-plugin.spec.dir/configuration - Configuration and tools
- @ref:specs/opencode-plugin.spec.dir/plugin-lifecycle - Plugin lifecycle
- @ref:specs/opencode-plugin.spec.dir/tools - Tools provided by plugin
- @ref:specs/opencode-plugin.spec.dir/error-handling - Error handling
- @ref:specs/opencode-plugin.spec.dir/checklist - Implementation checklist

---

*See individual parts in opencode-plugin.spec.dir/*
