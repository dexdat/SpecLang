# speclang-header lines:25
id: "@speclang/ui"
version: 0.2.0
layer: 2
tags: [dashboard, monitoring, system, mcp, web]
status: draft
children:
  - "@speclang/ui/overview"
  - "@speclang/ui/visual-design"
  - "@speclang/ui/components/cascade-status"
  - "@speclang/ui/components/agent-health"
  - "@speclang/ui/components/event-timeline"
  - "@speclang/ui/components/queue-depth"
  - "@speclang/ui/components/system-metrics"
  - "@speclang/ui/components/control-panel"
  - "@speclang/ui/components/cascade-graph"
  - "@speclang/ui/components/log-viewer"
  - "@speclang/ui/interactions"
  - "@speclang/ui/state-management"
  - "@speclang/ui/testing"
  - "@speclang/mcp-ui-tools"
short: System monitoring dashboard for SpecLang cascade and agent health (split into parts)
project_level: Alpha
agent_support: agent_assisted
---

# System Dashboard Specification

Web-based monitoring and control interface for the SpecLang reactive cascade.

This spec has been split into multiple parts for better organization and autonomous agent operation.

## Parts

- @speclang/ui/overview - Dashboard overview, architecture, and core views
- @speclang/ui/visual-design - Visual design system, CSS architecture, themes, accessibility
- @speclang/ui/components - Individual UI components (cascade status, agent health, etc.)
- @speclang/ui/interactions - User interactions and control flows
- @speclang/ui/state-management - State management and implementation notes
- @speclang/ui/testing - Testing strategy and specifications
- @speclang/mcp-ui-tools - MCP UI tools integration

---

*See individual parts in ui.spec.dir/*
