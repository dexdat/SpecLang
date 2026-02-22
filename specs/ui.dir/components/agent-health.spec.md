# speclang-header lines:14
id: "@speclang/ui.components.agent-health"
parent: "@ref:specs/ui"
part: 4/14
siblings:
  prev: "@ref:specs/ui.dir/components/cascade-status"
  next: "@ref:specs/ui.dir/components/event-timeline"
short: Agent health grid component
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 3
---

### @ui/component-agent-health-grid

```speclang
# @block:ui/component-agent-health-grid @kind:entity
AgentHealthGrid:
  purpose: Grid of agent status cards showing health, activity, and queue depth
  
  visual_design:
    layout: "Responsive grid with exposed grid lines background, each card occupies full cell"
    colors:
      idle_state: "var(--color-text-muted) gray border"
      active_state: "var(--color-accent) red border with black background"
      error_state: "var(--color-error) red border with red text"
      paused_state: "var(--color-text-muted) gray border with strikethrough"
    typography:
      agent_type: "var(--font-display) 14px uppercase"
      metrics: "var(--font-mono) 20px bold"
      labels: "var(--font-body) 11px uppercase"
    effects:
      - "Each card has 1px solid border separating from grid"
      - "Hover reveals red border and subtle grid line intensification"
      - "No rounded corners, sharp edges"
    animations:
      - "Card entry slides in with brutalist-slide animation"
      - "Status indicator pulses when agent becomes active"
      - "Queue depth number counts up linearly"
  
  props_interface:
    ```typescript
    interface AgentHealthGridProps {
      // Data
      agents: AgentStatus[];
      agentTypes: string[]; // Available agent types
      
      // Filtering
      filterByType: string | null;
      filterByStatus: AgentStatusType[] | null; // idle, active, error
      searchQuery: string;
      
      // Callbacks
      onAgentClick: (agentId: string) => void;
      onRestartAgent: (agentId: string) => Promise<void>;
      onPauseAgent: (agentId: string) => Promise<void>;
      onDebugAgent: (agentId: string) => void;
      onFilterChange: (filters: AgentFilters) => void;
      
      // Configuration
      autoRefresh: boolean;
      refreshInterval: number; // milliseconds
      showHeatmap: boolean;
      compactView: boolean;
      
      // UI state
      isLoading: boolean;
      error: Error | null;
    }
    
    interface AgentStatus {
      id: string;
      type: string; // spec-writer, code-gen, test-writer, north-star
      status: 'idle' | 'active' | 'error' | 'paused';
      currentFile: string | null;
      queueDepth: number;
      uptimeSeconds: number;
      lastActive: string; // ISO string
      performance: {
        processingTimeAvg: number;
        successRate: number;
        errorCount: number;
      };
      sessionId: string;
    }
    ```
  state_interface:
    ```typescript
    interface AgentHealthGridState {
      // Local UI state
      expandedAgentId: string | null;
      selectedAgentIds: string[];
      sortBy: keyof AgentStatus;
      sortDirection: 'asc' | 'desc';
      
      // Filter state
      localFilters: AgentFilters;
      
      // Async operation state
      restartingAgents: Set<string>;
      pausingAgents: Set<string>;
      
      // Data state
      lastUpdated: string;
      updateCount: number;
      
      // Error state
      agentErrors: Map<string, Error>;
    }
    ```
  lifecycle_methods:
    - componentDidMount: Start auto-refresh timer, subscribe to agent events
    - componentWillUnmount: Clear timers, unsubscribe
    - shouldComponentUpdate: Compare agents array efficiently
    - getSnapshotBeforeUpdate: Capture scroll position for smooth updates
  
  event_handlers:
    - handleAgentClick: Expand/collapse details panel
    - handleRestartClick: Confirm → call onRestartAgent → optimistic update → handle result
    - handlePauseClick: Toggle pause state → call onPauseAgent → update UI
    - handleFilterChange: Debounce → update local filters → call onFilterChange
    - handleRefresh: Manual refresh → fetch latest data
    - handleSortChange: Update sort state → reorder agents
  
  rendering_logic:
    - Grid layout with responsive columns (1 mobile, 2 tablet, 4 desktop)
    - Each agent card shows status indicator, type icon, queue depth, uptime
    - Expandable details panel with performance metrics and recent actions
    - Heatmap visualization for activity over time (if showHeatmap true)
    - Virtual scrolling for large agent lists (50+)
  
  error_boundary:
    - Catches errors in individual agent cards
    - Isolates errors to prevent grid collapse
    - Provides retry per agent
  
  performance_optimizations:
    - Virtualize agent grid for large datasets
    - Memoize filtered/sorted agent list
    - Debounce filter changes (300ms)
    - Lazy load heatmap visualization
    - Use windowing for large agent lists
  
  accessibility_requirements:
    - Grid role with row/column headers
    - Keyboard navigation between cards
    - Screen reader announcements for status changes
    - Focus management for expanded panels
  
  test_specifications:
    - Unit tests: render with 0, 1, many agents
    - Filter tests: filter by type/status/search
    - Sort tests: sort by all columns both directions
    - Interaction tests: click handlers, expansion
    - Performance tests: virtual scrolling with 1000 agents
    - Accessibility tests: keyboard navigation, ARIA labels
```
