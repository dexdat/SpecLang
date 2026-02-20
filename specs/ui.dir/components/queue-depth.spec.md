# speclang-header lines:10
id: "@speclang/ui.components.queue-depth"
parent: @ref:specs/ui
part: 6/14
siblings:
  prev: @ref:specs/ui.dir/components/event-timeline
  next: @ref:specs/ui.dir/components/system-metrics
short: Queue depth meter component
---

### @ui/component-queue-depth-meter

```speclang
# @block:ui/component-queue-depth-meter @kind:entity
QueueDepthMeter:
  purpose: Visual gauge showing pending command queue depth with priority breakdown
  
  visual_design:
    layout: "Circular gauge on left, priority breakdown bars on right, command list below"
    colors:
      gauge_low: "var(--color-success) green"
      gauge_medium: "var(--color-warning) yellow"
      gauge_high: "var(--color-error) red"
      priority_high: "var(--color-error) red"
      priority_medium: "var(--color-warning) yellow"
      priority_low: "var(--color-text-muted) gray"
    typography:
      gauge_value: "var(--font-mono) 48px bold"
      gauge_label: "var(--font-body) 12px uppercase"
      priority_label: "var(--font-display) 10px uppercase"
    effects:
      - "Circular gauge with sharp line strokes, no rounded ends"
      - "Priority breakdown as stacked bars with 1px borders between segments"
      - "Command list with alternating row backgrounds (zebra striping)"
    animations:
      - "Gauge needle sweeps linearly with depth changes"
      - "Priority bars grow horizontally with linear animation"
      - "New commands appear with slide-down animation"
  
  props_interface:
    ```typescript
    interface QueueDepthMeterProps {
      // Data
      queueDepth: number;
      maxQueueDepth: number; // Warning threshold
      priorityBreakdown: {
        high: number;
        medium: number;
        low: number;
      };
      pendingCommands: CommandSummary[];
      
      // Callbacks
      onViewQueue: () => void;
      onClearQueue: (priority: string | null) => Promise<void>;
      onPauseQueue: () => Promise<void>;
      onResumeQueue: () => Promise<void>;
      
      // Configuration
      showBreakdown: boolean;
      showCommands: boolean;
      warningThreshold: number; // percentage
      criticalThreshold: number; // percentage
      
      // UI state
      isLoading: boolean;
      error: Error | null;
    }
    
    interface CommandSummary {
      id: string;
      action: string;
      targetFile: string | null;
      priority: 'high' | 'medium' | 'low';
      ageSeconds: number;
      sessionId: string | null;
    }
    ```
  state_interface:
    ```typescript
    interface QueueDepthMeterState {
      // UI state
      isHovered: boolean;
      expanded: boolean;
      selectedPriority: string | null;
      
      // Async operation state
      isClearing: boolean;
      isPausing: boolean;
      isResuming: boolean;
      
      // Animation state
      previousDepth: number;
      animateChange: boolean;
      
      // Error state
      clearError: Error | null;
    }
    ```
  lifecycle_methods:
    - componentDidMount: Subscribe to queue depth updates
    - componentDidUpdate: Animate depth changes
    - componentWillUnmount: Unsubscribe
  
  event_handlers:
    - handleMeterClick: Navigate to queue status view
    - handleClearClick: Show confirmation → call onClearQueue → optimistic update
    - handlePauseResumeClick: Toggle → call onPauseQueue/onResumeQueue
    - handlePrioritySelect: Filter commands by priority
  
  rendering_logic:
    - Circular gauge showing queue depth percentage
    - Color gradient: green (low) → yellow (medium) → red (high)
    - Priority breakdown as stacked bars or pie chart
    - Command list with virtualization
    - Animated transitions for depth changes
  
  error_boundary:
    - Catches errors in queue operations
    - Shows fallback gauge with error state
  
  performance_optimizations:
    - Throttle gauge animations (60fps)
    - Memoize priority breakdown calculations
    - Virtualize command list
  
  accessibility_requirements:
    - ARIA gauge role with value, min, max
    - Screen reader announcements for threshold breaches
    - Keyboard controls for queue actions
  
  test_specifications:
    - Unit tests: render various depth levels
    - Threshold tests: warning/critical color changes
    - Interaction tests: click handlers
    - Animation tests: smooth depth transitions
    - Accessibility tests: ARIA gauge attributes
```