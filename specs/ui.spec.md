# speclang-header lines:25
id: "@speclang/ui"
version: 0.2.0
layer: 2
tags: [dashboard, monitoring, system, mcp, web]
status: draft
children:
  - "@ref:specs/ui/overview"
  - "@ref:specs/ui/visual-design"
  - "@ref:specs/ui/components/cascade-status"
  - "@ref:specs/ui/components/agent-health"
  - "@ref:specs/ui/components/event-timeline"
  - "@ref:specs/ui/components/queue-depth"
  - "@ref:specs/ui/components/system-metrics"
  - "@ref:specs/ui/components/control-panel"
  - "@ref:specs/ui/components/cascade-graph"
  - "@ref:specs/ui/components/log-viewer"
  - "@ref:specs/ui/interactions"
  - "@ref:specs/ui/state-management"
  - "@ref:specs/ui/testing"
  - "@ref:specs/mcp-ui-tools"
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
