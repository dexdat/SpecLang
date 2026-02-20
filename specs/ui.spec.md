# speclang-header lines:12
id: @speclang/ui
version: 0.2.0
layer: 2
tags: [dashboard, monitoring, system, mcp, web]
imports: ["@speclang/cascade", "@speclang/mcp", "@speclang/agent-protocol", "@speclang/sqlite", "@speclang/mcp-ui-tools"]
status: draft
children:
  - @ref:specs/ui.dir/overview
  - @ref:specs/ui.dir/visual-design
  - @ref:specs/ui.dir/components/cascade-status
  - @ref:specs/ui.dir/components/agent-health
  - @ref:specs/ui.dir/components/event-timeline
  - @ref:specs/ui.dir/components/queue-depth
  - @ref:specs/ui.dir/components/system-metrics
  - @ref:specs/ui.dir/components/control-panel
  - @ref:specs/ui.dir/components/cascade-graph
  - @ref:specs/ui.dir/components/log-viewer
  - @ref:specs/ui.dir/interactions
  - @ref:specs/ui.dir/state-management
  - @ref:specs/ui.dir/testing
  - @ref:specs/mcp-ui-tools
short: System monitoring dashboard for SpecLang cascade and agent health (split into parts)
---

# System Dashboard Specification

Web-based monitoring and control interface for the SpecLang reactive cascade.

This spec has been split into multiple parts for better organization and autonomous agent operation.

## Parts

- @ref:specs/ui.dir/overview - Dashboard overview, architecture, and core views
- @ref:specs/ui.dir/visual-design - Visual design system, CSS architecture, themes, accessibility
- @ref:specs/ui.dir/components/* - Individual UI components (cascade status, agent health, etc.)
- @ref:specs/ui.dir/interactions - User interactions and control flows
- @ref:specs/ui.dir/state-management - State management and implementation notes
- @ref:specs/ui.dir/testing - Testing strategy and specifications
- @ref:specs/mcp-ui-tools - MCP UI tools integration

---

*See individual parts in ui.dir/*