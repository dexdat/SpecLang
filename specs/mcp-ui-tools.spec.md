# speclang-header lines:14
id: "@speclang/mcp-ui-tools"
version: 0.1.0
layer: 3
imports: ["@speclang/mcp", "@speclang/sqlite", "@speclang/cascade", "@speclang/agent-protocol"]
tags: [mcp, tools, ui, dashboard, monitoring]
status: draft
short: Additional MCP tools for system dashboard monitoring
project_level: Alpha
agent_support: agent_assisted
children:
  - "@speclang/mcp-ui-tools/tools"
  - "@speclang/mcp-ui-tools/ui"
---

# MCP UI Tools

This spec has been split into sub-specs. See `mcp-ui-tools.spec.dir/` for details.

## Overview

### @block::purpose @kind:entity

Purpose:
  description: MCP tools for dashboard and monitoring
  components:
    - Tool definitions for UI
    - Data aggregation
    - Real-time updates

### @block::tools @kind:entity

AvailableTools:
  - speclang_status: Get system status
  - speclang_metrics: Get performance metrics
  - speclang_logs: Query recent logs
  - speclang_agents: List active agents
  - speclang_cascades: View cascade history

### @block::ui-components @kind:entity

UIComponents:
  - Dashboard: Main overview
  - Agents: Agent status panel
  - Cascades: Cascade timeline
  - Metrics: Performance graphs
  - Logs: Log viewer

### @block::children @kind:entity

ChildSpecs:
  - "@speclang/mcp-ui-tools/tools" – Tool definitions"
  - "@speclang/mcp-ui-tools/ui" – UI components"

### @block::real-time @kind:entity

RealTime:
  protocol: SSE (Server-Sent Events)
  events:
    - agent_status
    - cascade_progress
    - system_metrics
