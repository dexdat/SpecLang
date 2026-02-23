---
name: sip-036-ui-speclang-v0
title: "SIP 36: UI Dashboard"
version: 0.1.0
description: System monitoring dashboard for SpecLang cascade and agent health
category: standard
---

# SIP 36: UI Dashboard

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the UI Dashboard—a web-based monitoring and control interface for SpecLang.

### Quick Start

Dashboard provides real-time visibility into:
- **Cascade status**: Current propagation state
- **Agent health**: Which agents are running
- **Event timeline**: What happened when
- **Queue depth**: Work waiting to process
- **System metrics**: Performance data

### When to Read This

- **Monitoring**: Check system health
- **Debugging**: See what agents are doing
- **Control**: Pause/resume cascade

### Related SIPs

- SIP 10: Daemon
- SIP 11: MCP Tools
- SIP 28: Cascade Protocol
- SIP 38: OpenCode Integration

## Abstract

This SIP defines the UI Dashboard—a web-based interface for monitoring and controlling the SpecLang reactive cascade. It shows real-time cascade status, agent health, event timelines, queue depths, and system metrics through MCP UI tools.

## Motivation

Users need visibility into the cascade system:
- See what's happening in real-time
- Understand why cascade isn't converging
- Monitor agent health and performance
- Control cascade execution

This SIP provides a dashboard for all of the above.

## Rationale

**Web-based dashboard:**

1. **Accessible**: Works in any browser
2. **Real-time**: SSE for live updates
3. **Interactive**: Control cascade, view details
4. **Modular**: Split into components

## Specification

### Architecture

```yaml
DashboardArchitecture:
  frontend:
    framework: "Web-based (vanilla JS or framework)"
    communication: "SSE for real-time events"
    
  backend:
    provider: "MCP UI Tools"
    data_source: "SQLite database"
    
  components:
    - cascade_status
    - agent_health
    - event_timeline
    - queue_depth
    - system_metrics
    - control_panel
    - cascade_graph
    - log_viewer
```

### Core Views

```yaml
CoreViews:
  main_dashboard:
    route: "/"
    layout: "grid"
    widgets:
      - cascade_status: "top-left"
      - agent_health: "top-right"
      - queue_depth: "middle-left"
      - system_metrics: "middle-right"
      - event_timeline: "bottom-full-width"
      
  cascade_detail:
    route: "/cascade/:id"
    shows:
      - "Cascade graph"
      - "Block dependencies"
      - "Propagated changes"
      
  agent_detail:
    route: "/agent/:id"
    shows:
      - "Agent status"
      - "Recent actions"
      - "Performance metrics"
```

### Components

```yaml
Components:
  CascadeStatus:
    displays:
      - "Current state (running, converged, error)"
      - "Depth level"
      - "Iteration count"
      - "Last convergence time"
      
  AgentHealth:
    displays:
      - "Agent list with status"
      - "Current task per agent"
      - "Success/failure rate"
      - "Response time"
      
  EventTimeline:
    displays:
      - "Chronological event list"
      - "Event type icons"
      - "Timestamps"
      - "Filtering options"
      
  QueueDepth:
    displays:
      - "Pending events count"
      - "Processing rate"
      - "Queue visualization"
      
  SystemMetrics:
    displays:
      - "Memory usage"
      - "CPU usage"
      - "Database size"
      - "File count"
      
  ControlPanel:
    actions:
      - "Pause cascade"
      - "Resume cascade"
      - "Force convergence check"
      - "Clear queue"
      
  CascadeGraph:
    displays:
      - "Block dependency graph"
      - "Propagation path"
      - "Affected blocks highlighted"
      
  LogViewer:
    displays:
      - "Recent log entries"
      - "Log level filter"
      - "Search functionality"
```

### State Management

```yaml
StateManagement:
  data_flow:
    - "SQLite -> MCP UI Tools -> Dashboard"
    
  real_time:
    mechanism: "Server-Sent Events (SSE)"
    events:
      - "cascade:started"
      - "cascade:propagated"
      - "cascade:converged"
      - "agent:started"
      - "agent:finished"
      - "queue:updated"
      - "metrics:updated"
      
  caching:
    strategy: "Client-side state with SSE updates"
```

### Interactions

```yaml
Interactions:
  user_actions:
    pause_cascade:
      trigger: "Click pause button"
      action: "Send MCP command to pause"
      feedback: "Status updates to paused"
      
    resume_cascade:
      trigger: "Click resume button"
      action: "Send MCP command to resume"
      feedback: "Status updates to running"
      
    view_block_detail:
      trigger: "Click block in graph"
      action: "Navigate to block detail"
      shows: "Full block content"
      
    filter_events:
      trigger: "Select event type filter"
      action: "Update timeline query"
      feedback: "Timeline shows filtered events"
```

### Testing

```yaml
Testing:
  unit_tests:
    - "Component rendering"
    - "State updates"
    - "Event handling"
    
  integration_tests:
    - "SSE connection"
    - "MCP tool integration"
    - "Real-time updates"
    
  e2e_tests:
    - "Full dashboard workflow"
    - "Control actions"
    - "Error handling"
```

## Examples

### Example 1: Dashboard Layout

```yaml
layout:
  header:
    title: "SpecLang Dashboard"
    controls: [pause, resume, refresh]
    
  main:
    columns: 2
    
    row_1:
      col_1:
        component: CascadeStatus
        size: medium
        
      col_2:
        component: AgentHealth
        size: medium
        
    row_2:
      col_1:
        component: QueueDepth
        size: small
        
      col_2:
        component: SystemMetrics
        size: small
        
    row_3:
      col_1_2:
        component: EventTimeline
        size: full
        
  sidebar:
    - LogViewer
    - ControlPanel
```

### Example 2: Cascade Status Widget

```yaml
CascadeStatus:
  current_state: "running"
  depth: 3
  iteration: 7
  last_convergence: "2024-01-15 14:32:00"
  
  display:
    state_badge:
      running: "🟢 Running"
      converged: "✅ Converged"
      paused: "⏸️ Paused"
      error: "🔴 Error"
      
    depth_indicator: "Depth: 3/10"
    iteration_counter: "Iteration: 7"
```

### Example 3: Event Timeline

```yaml
EventTimeline:
  events:
    - timestamp: "14:32:05"
      type: "file.edited"
      source: "specs/auth.spec.md"
      details: "Header updated"
      
    - timestamp: "14:32:04"
      type: "cascade.propagated"
      source: "Block @specs/auth#login"
      details: "Change propagated to 3 blocks"
      
    - timestamp: "14:32:02"
      type: "agent.finished"
      source: "spec-writer"
      details: "Completed in 2.3s"
      
  filters:
    types: [all, file, cascade, agent, error]
    time_range: [1h, 6h, 24h, all]
```

## Implementation

```typescript
interface DashboardState {
  cascade: CascadeStatus;
  agents: AgentHealth[];
  events: Event[];
  queue: QueueStatus;
  metrics: SystemMetrics;
}

class DashboardComponent {
  private eventSource: EventSource;
  private state: DashboardState;
  
  constructor() {
    this.connectSSE();
  }
  
  private connectSSE(): void {
    this.eventSource = new EventSource('/api/events');
    
    this.eventSource.addEventListener('cascade:propagated', (e) => {
      this.state.cascade = JSON.parse(e.data);
      this.render();
    });
    
    this.eventSource.addEventListener('agent:finished', (e) => {
      this.state.agents.push(JSON.parse(e.data));
      this.render();
    });
  }
  
  public pauseCascade(): void {
    fetch('/api/cascade/pause', { method: 'POST' });
  }
  
  public resumeCascade(): void {
    fetch('/api/cascade/resume', { method: 'POST' });
  }
  
  private render(): void {
    this.renderCascadeStatus();
    this.renderAgentHealth();
    this.renderEventTimeline();
  }
}
```

## References

- @ref:speclang/ui
- @ref:speclang/ui.spec.dir/overview
- @ref:speclang/ui.spec.dir/components
- @ref:speclang/mcp-ui-tools
- SIP 10: Daemon
- SIP 11: MCP Tools
- SIP 28: Cascade Protocol

## Copyright

This document is in the public domain.
