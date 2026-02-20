# speclang-header lines:10
id: "@speclang/ui.components.event-timeline"
parent: @ref:specs/ui
part: 5/14
siblings:
  prev: @ref:specs/ui.dir/components/agent-health
  next: @ref:specs/ui.dir/components/queue-depth
short: Event timeline component
---

### @ui/component-event-timeline

```speclang
# @block:ui/component-event-timeline @kind:entity
EventTimeline:
  purpose: Vertical timeline of recent cascade events with filtering and drill-down
  
  visual_design:
    layout: "Vertical timeline with left-aligned events, connecting line down center"
    colors:
      success_event: "var(--color-success) green border"
      error_event: "var(--color-error) red border"
      pending_event: "var(--color-warning) yellow border"
      agent_colors:
        spec_writer: "#000000"
        code_gen: "#2a2a2a"
        test_writer: "#444444"
        north_star: "#666666"
    typography:
      timestamp: "var(--font-mono) 11px uppercase"
      event_title: "var(--font-display) 14px"
      details: "var(--font-body) 12px"
    effects:
      - "Connecting line is 1px solid white, dashed for errors"
      - "Event cards have 1px border, no rounded corners"
      - "Selected event gets red left border and grid background"
    animations:
      - "New events slide in from left with brutalist-slide"
      - "Timeline line draws progressively as user scrolls"
      - "Event selection highlights with instant border change"
  
  props_interface:
    ```typescript
    interface EventTimelineProps {
      // Data
      events: CascadeEvent[];
      totalEvents: number; // For pagination
      
      // Filtering
      filterByAgent: string | null;
      filterByFile: string | null;
      filterByDepth: { min: number, max: number } | null;
      timeRange: { start: string, end: string } | null;
      
      // Callbacks
      onEventClick: (event: CascadeEvent) => void;
      onFilterChange: (filters: EventFilters) => void;
      onLoadMore: () => Promise<void>;
      onExport: (format: 'json' | 'csv') => Promise<void>;
      
      // Configuration
      autoScroll: boolean;
      showDetails: boolean;
      groupBy: 'agent' | 'depth' | 'time' | 'none';
      maxEvents: number; // Virtualization limit
      
      // UI state
      isLoading: boolean;
      isLoadingMore: boolean;
      error: Error | null;
    }
    
    interface CascadeEvent {
      id: string;
      cascadeId: string;
      depth: number;
      triggerFile: string;
      agent: string;
      outputFiles: string[];
      timestamp: string; // ISO string
      durationMs: number;
      status: 'success' | 'error' | 'pending';
      errorMessage: string | null;
    }
    ```
  state_interface:
    ```typescript
    interface EventTimelineState {
      // UI state
      selectedEventId: string | null;
      expandedEventIds: Set<string>;
      scrollPosition: number;
      isScrolling: boolean;
      
      // Filter state
      localFilters: EventFilters;
      filterDebounceTimer: NodeJS.Timeout | null;
      
      // Virtualization
      visibleRange: { start: number, end: number };
      itemHeights: Map<string, number>;
      
      // Loading state
      isExporting: boolean;
      exportProgress: number;
      
      // Error state
      loadErrors: Map<string, Error>;
    }
    ```
  lifecycle_methods:
    - componentDidMount: Setup scroll listener, virtualization calculations
    - componentWillUnmount: Cleanup timers, listeners
    - getSnapshotBeforeUpdate: Capture scroll position for smooth updates
    - componentDidUpdate: Handle filter changes, adjust virtualization
  
  event_handlers:
    - handleEventClick: Select event, show details panel
    - handleScroll: Virtualize events, load more if near bottom
    - handleFilterChange: Debounce → update local filters → call onFilterChange
    - handleExportClick: Show format selector → call onExport → track progress
    - handleLoadMore: Call onLoadMore → append events → adjust virtualization
  
  rendering_logic:
    - Vertical timeline with events as cards
    - Color coding by agent type, status
    - Group headers when groupBy enabled
    - Virtual scrolling for performance
    - Details panel on event selection
    - Timeline scale with zoom controls
  
  error_boundary:
    - Catches errors in individual event rendering
    - Falls back to simple event display
    - Preserves timeline continuity
  
  performance_optimizations:
    - Virtualize events (render only visible ones)
    - Memoize event cards based on event ID
    - Throttle scroll events
    - Lazy load details panels
  
  accessibility_requirements:
    - Timeline role with aria-posinset, aria-setsize
    - Keyboard navigation between events
    - Screen reader announcements for new events
    - High contrast timeline colors
  
  test_specifications:
    - Unit tests: render with 0, 1, many events
    - Virtualization tests: only render visible events
    - Filter tests: filter by agent/file/depth
    - Scroll tests: load more on scroll
    - Export tests: export functionality
    - Accessibility tests: keyboard navigation
```