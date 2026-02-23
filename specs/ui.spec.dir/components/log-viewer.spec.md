# speclang-header lines:14
id: "@speclang/ui.components.log-viewer"
parent: "@ref:specs/ui"
part: 10/14
siblings:
  prev: "@ref:specs/ui.spec.dir/components/cascade-graph"
  next: "@ref:specs/ui.spec.dir/interactions"
short: Log viewer component
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 3
---

### @ui/component-log-viewer

```speclang
# @block:ui/component-log-viewer @kind:entity
LogViewer:
  purpose: Real-time log viewer with filtering, search, and export capabilities
  
  visual_design:
    layout: "Virtualized list with left-aligned timestamps, level indicators, and message"
    colors:
      error_level: "var(--color-error) red text on black background"
      warn_level: "var(--color-warning) yellow text"
      info_level: "var(--color-text) white text"
      debug_level: "var(--color-text-muted) gray text"
    typography:
      timestamp: "var(--font-mono) 11px"
      level: "var(--font-display) 10px uppercase"
      message: "var(--font-body) 13px monospace"
    effects:
      - "Each log row separated by 1px solid border"
      - "Error rows have red left border"
      - "Search matches highlighted with yellow background"
      - "No rounded corners, sharp edges"
    animations:
      - "New log entries slide in from left (brutalist-slide)"
      - "Auto-scroll follows tail with linear motion"
      - "Highlight pulses on error arrival"
  
  props_interface:
    ```typescript
    interface LogViewerProps {
      // Data
      logs: LogEntry[];
      totalLogs: number;
      logSources: string[]; // Available sources
      
      // Filtering
      filterByLevel: LogLevel[]; // error, warn, info, debug
      filterBySource: string | null;
      filterByTimeRange: TimeRange | null;
      searchQuery: string;
      
      // Callbacks
      onLoadMore: () => Promise<void>;
      onFilterChange: (filters: LogFilters) => void;
      onExportLogs: (format: 'json' | 'text' | 'csv') => Promise<void>;
      onClearLogs: () => Promise<void>;
      
      // Configuration
      autoScroll: boolean;
      followTail: boolean;
      showTimestamps: boolean;
      wrapLines: boolean;
      maxLines: number; // Virtualization limit
      
      // UI state
      isLoading: boolean;
      isLoadingMore: boolean;
      error: Error | null;
    }
    
    interface LogEntry {
      id: string;
      timestamp: string; // ISO string
      level: 'error' | 'warn' | 'info' | 'debug';
      source: string; // agent, cascade, mcp, system
      message: string;
      metadata: Record<string, any>;
      context: {
        cascadeId?: string;
        agentId?: string;
        filePath?: string;
      };
    }
    ```
  state_interface:
    ```typescript
    interface LogViewerState {
      // UI state
      selectedLogId: string | null;
      expandedLogIds: Set<string>;
      scrollPosition: number;
      isScrolling: boolean;
      
      // Filter state
      localFilters: LogFilters;
      filterDebounceTimer: NodeJS.Timeout | null;
      searchDebounceTimer: NodeJS.Timeout | null;
      
      // Virtualization
      visibleRange: { start: number, end: number };
      lineHeights: Map<string, number>;
      
      // Export state
      isExporting: boolean;
      exportProgress: number;
      
      // Follow tail state
      isFollowingTail: boolean;
      tailSubscription: EventSource | null;
    }
    ```
  lifecycle_methods:
    - componentDidMount: Setup scroll listener, virtualization, subscribe to tail
    - componentWillUnmount: Cleanup timers, subscriptions, listeners
    - getSnapshotBeforeUpdate: Capture scroll position for smooth updates
    - componentDidUpdate: Handle filter changes, adjust virtualization
  
  event_handlers:
    - handleLogClick: Select log, show details panel
    - handleScroll: Virtualize logs, load more if near bottom, update follow tail
    - handleFilterChange: Debounce → update local filters → call onFilterChange
    - handleSearchChange: Debounce → update search query → refilter logs
    - handleExportClick: Show format selector → call onExportLogs → track progress
    - handleClearClick: Confirm → call onClearLogs → clear local logs
  
  rendering_logic:
    - Virtualized list of log entries
    - Color coding by log level (red error, yellow warn, etc.)
    - Expandable details for metadata/context
    - Search highlighting
    - Auto-scroll when following tail
    - Line numbers and timestamps
  
  error_boundary:
    - Catches errors in log rendering
    - Falls back to simple text display
    - Preserves log viewing functionality
  
  performance_optimizations:
    - Virtualize log entries (render only visible ones)
    - Memoize log line rendering based on content
    - Debounce filter/search changes
    - Throttle scroll events
    - Lazy load metadata panels
  
  accessibility_requirements:
    - Log list as table with ARIA roles
    - Keyboard navigation between logs
    - Screen reader announcements for new errors
    - High contrast color coding
  
  test_specifications:
    - Unit tests: render with 0, 1, many logs
    - Virtualization tests: only render visible logs
    - Filter tests: filter by level/source/time
    - Search tests: highlight matching text
    - Export tests: export functionality
    - Accessibility tests: keyboard navigation
```
