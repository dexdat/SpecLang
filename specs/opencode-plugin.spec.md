# speclang-header lines:15
id: "@speclang/opencode-plugin"
version: 0.2.0
layer: 3
imports: ["@speclang/core", "@speclang/agent-protocol", "@speclang/sqlite", "@speclang/mcp"]
tags: [opencode, plugin, typescript, implementation]
children:
  - "@ref:specs/opencode-plugin.dir/overview"
  - "@ref:specs/opencode-plugin.dir/architecture"
  - "@ref:specs/opencode-plugin.dir/event-system"
  - "@ref:specs/opencode-plugin.dir/session-manager"
  - "@ref:specs/opencode-plugin.dir/ownership-guard"
  - "@ref:specs/opencode-plugin.dir/mcp-client"
  - "@ref:specs/opencode-plugin.dir/git-integration"
  - "@ref:specs/opencode-plugin.dir/convergence"
  - "@ref:specs/opencode-plugin.dir/configuration"
  - "@ref:specs/opencode-plugin.dir/plugin-lifecycle"
  - "@ref:specs/opencode-plugin.dir/tools"
  - "@ref:specs/opencode-plugin.dir/error-handling"
  - "@ref:specs/opencode-plugin.dir/checklist"
short: TypeScript OpenCode plugin for Speclang integration (split into parts)
---
# OpenCode Plugin Implementation

TypeScript plugin for OpenCode that integrates Speclang reactive cascade system.

This spec has been split into multiple parts for better organization and autonomous agent operation.

## Parts

- @ref:specs/opencode-plugin.dir/overview - Overview and plugin lifecycle
- @ref:specs/opencode-plugin.dir/architecture - Architecture diagram and components
- @ref:specs/opencode-plugin.dir/event-system - Event system integration
- @ref:specs/opencode-plugin.dir/session-manager - Session management
- @ref:specs/opencode-plugin.dir/ownership-guard - Ownership guard
- @ref:specs/opencode-plugin.dir/mcp-client - MCP client integration
- @ref:specs/opencode-plugin.dir/git-integration - Git integration
- @ref:specs/opencode-plugin.dir/convergence - Convergence detection
- @ref:specs/opencode-plugin.dir/configuration - Configuration and tools
- @ref:specs/opencode-plugin.dir/plugin-lifecycle - Plugin lifecycle
- @ref:specs/opencode-plugin.dir/tools - Tools provided by plugin
- @ref:specs/opencode-plugin.dir/error-handling - Error handling
- @ref:specs/opencode-plugin.dir/checklist - Implementation checklist

---

*See individual parts in opencode-plugin.dir/*