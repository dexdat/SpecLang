# speclang-header lines:10
id: "@speclang/ui.components.cascade-graph"
parent: "@ref:specs/ui"
part: 9/14
siblings:
  prev: "@ref:specs/ui.dir/components/control-panel"
  next: "@ref:specs/ui.dir/components/log-viewer"
short: Cascade graph visualization component
---

### @ui/component-cascade-graph

```speclang
# @block:ui/component-cascade-graph @kind:entity
CascadeGraph:
  purpose: Interactive D3.js graph visualization of file dependencies and cascade flow
  
  visual_design:
    layout: "Force-directed graph with exposed grid background, pan/zoom controls"
    colors:
      spec_node: "var(--color-success) green border"
      generated_node: "var(--color-text-muted) gray border"
      test_node: "var(--color-warning) yellow border"
      agent_node: "var(--color-accent) red border"
      dependency_edge: "var(--color-text-muted) gray"
      trigger_edge: "var(--color-accent) red"
      cascade_flow: "var(--color-success) green animated gradient"
    typography:
      node_label: "var(--font-mono) 10px"
      edge_label: "var(--font-body) 8px uppercase"
    effects:
      - "Nodes are squares with 1px borders, no rounded corners"
      - "Edges are straight lines with arrowheads (triangles)"
      - "Cascade flow animation as moving dashed line"
      - "Selected node gets red border and grid background"
    animations:
      - "Force layout simulation with linear easing"
      - "Cascade flow animation along edges (brutalist-pulse)"
      - "Node entry/exit slides with linear motion"
  
  props_interface:
    ```typescript
    interface CascadeGraphProps {
      // Data
      nodes: GraphNode[];
      edges: GraphEdge[];
      cascadeEvents: CascadeEvent[];
      
      // Filtering
      filterByDepth: number | null;
      filterByAgent: string | null;
      filterByFileType: string | null; // spec, generated, test
      
      // Callbacks
      onNodeClick: (node: GraphNode) => void;
      onEdgeClick: (edge: GraphEdge) => void;
      onViewportChange: (viewport: Viewport) => void;
      onExportGraph: (format: 'svg' | 'png' | 'json') => Promise<void>;
      
      // Configuration
      layout: 'force' | 'hierarchical' | 'radial';
      showLabels: boolean;
      showAnimations: boolean;
      autoLayout: boolean;
      maxNodes: number; // Performance limit
      
      // UI state
      isLoading: boolean;
      error: Error | null;
    }
    
    interface GraphNode {
      id: string;
      type: 'spec' | 'generated' | 'test' | 'agent';
      label: string;
      filePath: string;
      layer: number;
      tags: string[];
      status: 'unchanged' | 'modified' | 'generated' | 'error';
      size: number; // Visual size
    }
    
    interface GraphEdge {
      source: string;
      target: string;
      type: 'dependency' | 'trigger' | 'generates';
      strength: number;
      cascadeDepth: number;
    }
    ```
  state_interface:
    ```typescript
    interface CascadeGraphState {
      // Graph state
      viewport: Viewport;
      selectedNodeId: string | null;
      selectedEdgeId: string | null;
      hoveredElementId: string | null;
      
      // Layout state
      layoutRunning: boolean;
      layoutIterations: number;
      nodePositions: Map<string, { x: number, y: number }>;
      
      // Filter state
      localFilters: GraphFilters;
      
      // Performance state
      renderedNodes: Set<string>; // For virtualization
      frameRequestId: number | null;
      
      // Export state
      isExporting: boolean;
      exportProgress: number;
    }
    ```
  lifecycle_methods:
    - componentDidMount: Initialize D3, setup layout engine, start animation loop
    - componentWillUnmount: Cleanup D3, cancel animation frame
    - shouldComponentUpdate: Optimize re-renders based on data changes
    - getSnapshotBeforeUpdate: Capture graph state for smooth transitions
  
  event_handlers:
    - handleNodeClick: Select node, show details panel
    - handleEdgeClick: Highlight dependency path
    - handleZoom: Update viewport, call onViewportChange
    - handleDrag: Update node positions
    - handleFilterChange: Update local filters, re-layout graph
    - handleExportClick: Generate export → call onExportGraph → track progress
  
  rendering_logic:
    - SVG-based graph rendering with D3
    - Force-directed or hierarchical layout
    - Node coloring by type/status
    - Edge styling by type/strength
    - Animated cascade flow visualization
    - Details panel for selected elements
    - Zoom and pan controls
  
  error_boundary:
    - Catches D3 rendering errors
    - Falls back to simplified node list
    - Preserves graph data for recovery
  
  performance_optimizations:
    - WebGL rendering for large graphs (1000+ nodes)
    - Level-of-detail rendering based on zoom
    - Throttle layout calculations
    - Virtualize off-screen nodes
    - Use requestAnimationFrame for animations
  
  accessibility_requirements:
    - SVG titles and descriptions
    - Keyboard navigation for graph elements
    - Text alternative for graph structure
    - High contrast mode support
  
  test_specifications:
    - Unit tests: render with various graph sizes
    - Layout tests: different layout algorithms
    - Interaction tests: node/edge clicks, zoom, drag
    - Performance tests: large graph rendering
    - Export tests: export functionality
    - Accessibility tests: keyboard navigation
```