---
id: "@speclang/ui.components.cascade-status"
parent: ""@ref:specs/ui"part: 3/14
siblings:
  prev: ""@ref:specs/ui.spec.dir/visual-design"  next: ""@ref:specs/ui.spec.dir/components/agent-health"short: Cascade status card component
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 3
---

### @ui/component-cascade-status-card

```speclang
# @block:ui/component-cascade-status-card @kind:entity
CascadeStatusCard:
  purpose: Display current cascade status (active/converged) with depth and timing
  
  visual_design:
    layout: "Vertical stack: status indicator at top, depth meter middle, timers bottom, controls right-aligned"
    colors:
      active_state: "var(--color-accent) red border with black background"
      converged_state: "var(--color-success) green border with black background"
      warning_state: "var(--color-warning) yellow border with black background"
      error_state: "var(--color-error) red border with black background, red text"
    typography:
      title: "var(--font-display) 24px uppercase"
      metrics: "var(--font-mono) 32px bold"
      labels: "var(--font-body) 12px uppercase"
    effects:
      - "Exposed grid lines as subtle background texture"
      - "1px solid borders separating sections"
      - "No rounded corners"
    animations:
      - "Depth meter fills with linear animation over 200ms"
      - "Status border pulses (brutalist-pulse) when active"
      - "Error state blinks (brutalist-blink) 3 times"
  
  props_interface:
    ```typescript
    interface CascadeStatusCardProps {
      // Core status
      active: boolean;
      converged: boolean;
      depth: number;
      maxDepth: number;
      
      // Timing
      lastEventTime: string | null; // ISO string
      convergenceTime: string | null; // ISO string
      cascadeId: string | null;
      
      // Callbacks
      onTriggerCascade: () => Promise<void>;
      onPauseResume: () => Promise<void>;
      onFinalize: () => Promise<void>;
      onViewDetails: () => void;
      
      // UI state
      isLoading: boolean;
      error: Error | null;
      
      // Configuration
      showControls: boolean;
      compactView: boolean;
    }
    ```
  state_interface:
    ```typescript
    interface CascadeStatusCardState {
      // Local UI state
      isHovered: boolean;
      isExpanded: boolean;
      confirmationPending: boolean;
      
      // Async operation state
      isTriggering: boolean;
      isPausing: boolean;
      isFinalizing: boolean;
      
      // Error state
      lastError: Error | null;
      errorDismissed: boolean;
    }
    ```
  lifecycle_methods:
    - componentDidMount: Subscribe to SSE cascade events
    - componentWillUnmount: Unsubscribe from events
    - getDerivedStateFromError: Error boundary for async operations
    - componentDidUpdate: Update timers, handle prop changes
  
  event_handlers:
    - handleTriggerClick: Validate preconditions → call onTriggerCascade → optimistic update → handle success/error
    - handlePauseResumeClick: Toggle state → call onPauseResume → update button label
    - handleFinalizeClick: Show confirmation → call onFinalize → show progress → handle result
    - handleCardClick: Navigate to cascade monitor view
    - handleErrorDismiss: Clear error state
  
  rendering_logic:
    - Conditionally render based on active/converged state
    - Color coding: green (converged), yellow (active), red (error/stuck)
    - Depth meter visualization with warning thresholds
    - Timer display with auto-updating intervals
    - Control buttons with loading states
  
  error_boundary:
    - Catches errors in async operations
    - Displays fallback UI with retry option
    - Logs errors to MCP server via speclang_log_error
  
  performance_optimizations:
    - Memoize computed values (depth percentage, time strings)
    - Throttle timer updates (1-second interval)
    - Use React.memo for prop equality
    - Lazy load heavy visualizations
  
  accessibility_requirements:
    - ARIA labels for status indicators
    - Keyboard navigation for buttons
    - Screen reader announcements for status changes
    - High contrast color support
  
  test_specifications:
    - Unit tests: render with various status combinations
    - Interaction tests: click handlers trigger correct callbacks
    - Error boundary tests: recover from async errors
    - Performance tests: memoization prevents unnecessary re-renders
    - Accessibility tests: ARIA labels present and correct
```
