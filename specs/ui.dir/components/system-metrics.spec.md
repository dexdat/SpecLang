# speclang-header lines:10
id: "@speclang/ui.components.system-metrics"
parent: "@ref:specs/ui"
part: 7/14
siblings:
  prev: "@ref:specs/ui.dir/components/queue-depth"
  next: "@ref:specs/ui.dir/components/control-panel"
short: System metrics panel component
---

### @ui/component-system-metrics-panel

```speclang
# @block:ui/component-system-metrics-panel @kind:entity
SystemMetricsPanel:
  purpose: Charts showing system resource usage (CPU, memory, disk) and performance metrics
  
  visual_design:
    layout: "Grid of charts (2x2), each chart with title, value, and sparkline"
    colors:
      cpu_chart: "var(--color-accent) red"
      memory_chart: "var(--color-success) green"
      disk_chart: "var(--color-text-muted) gray"
      network_chart: "var(--color-warning) yellow"
      threshold_warning: "var(--color-warning) yellow"
      threshold_critical: "var(--color-error) red"
    typography:
      chart_title: "var(--font-display) 12px uppercase"
      chart_value: "var(--font-mono) 32px bold"
      chart_unit: "var(--font-body) 12px"
    effects:
      - "Charts use sharp line strokes, no curves (step function)"
      - "Grid lines visible behind charts"
      - "Threshold lines as dashed 1px lines"
    animations:
      - "Chart lines draw progressively on load"
      - "Value updates with count-up animation"
      - "Threshold breaches trigger brutalist-blink"
  
  props_interface:
    ```typescript
    interface SystemMetricsPanelProps {
      // Data
      metrics: SystemMetrics;
      history: SystemMetricsHistory[]; // Last N samples
      
      // Callbacks
      onRefresh: () => Promise<void>;
      onTimeRangeChange: (range: TimeRange) => void;
      onMetricSelect: (metric: string) => void;
      
      // Configuration
      timeRange: TimeRange;
      refreshInterval: number;
      autoRefresh: boolean;
      showCharts: boolean;
      chartType: 'line' | 'bar' | 'area';
      selectedMetrics: string[];
      
      // UI state
      isLoading: boolean;
      error: Error | null;
    }
    
    interface SystemMetrics {
      cpu: {
        percent: number;
        cores: number;
        loadAverage: number[];
      };
      memory: {
        used: number; // MB
        total: number; // MB
        percent: number;
      };
      disk: {
        used: number; // MB
        total: number; // MB
        percent: number;
      };
      network: {
        bytesIn: number;
        bytesOut: number;
      };
      process: {
        specLangMemory: number; // MB
        specLangCpu: number; // percent
      };
    }
    ```
  state_interface:
    ```typescript
    interface SystemMetricsPanelState {
      // UI state
      expandedChart: string | null; // cpu, memory, disk, network
      hoveredDataPoint: { metric: string, index: number } | null;
      chartDimensions: { width: number, height: number };
      
      // Refresh state
      lastRefreshTime: string;
      refreshTimer: NodeJS.Timeout | null;
      
      // Data state
      localHistory: SystemMetricsHistory[];
      historyLimit: number;
      
      // Error state
      metricErrors: Map<string, Error>;
    }
    ```
  lifecycle_methods:
    - componentDidMount: Setup refresh timer, resize listener
    - componentWillUnmount: Clear timers, listeners
    - componentDidUpdate: Handle time range changes
  
  event_handlers:
    - handleRefresh: Call onRefresh → update metrics
    - handleChartHover: Show tooltip with detailed values
    - handleChartClick: Drill down into metric details
    - handleTimeRangeChange: Update local state → call onTimeRangeChange
    - handleResize: Update chart dimensions
  
  rendering_logic:
    - Grid of charts (CPU, memory, disk, network)
    - Real-time updating charts
    - Tooltips with detailed metrics
    - Threshold indicators (warning/critical)
    - Historical trend lines
  
  error_boundary:
    - Catches errors in individual charts
    - Falls back to simplified numeric display
    - Preserves other functioning charts
  
  performance_optimizations:
    - Throttle chart updates (1-second intervals)
    - Memoize chart data calculations
    - Use canvas-based charts for performance
    - Debounce resize events
  
  accessibility_requirements:
    - Chart titles and descriptions
    - Data table alternative for screen readers
    - High contrast chart colors
    - Keyboard navigation between charts
  
  test_specifications:
    - Unit tests: render with various metric values
    - Chart tests: correct rendering of data points
    - Refresh tests: auto-refresh functionality
    - Error tests: graceful degradation
    - Accessibility tests: screen reader alternatives
```