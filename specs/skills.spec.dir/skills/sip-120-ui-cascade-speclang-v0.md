---
name: sip-120-ui-cascade-speclang-v0
title: "SIP 120: UI Cascade Graph"
version: 0.1.0
description: Cascade dependency graph visualization for SpecLang dashboard
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 120: UI Cascade Graph

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the Cascade Graph visualization for the SpecLang dashboard, displaying spec dependencies, cascade triggers, and relationship flow.

### Quick Start

```yaml
CascadeGraph:
  nodes:
    - id: "@northstar"
      level: 0
      type: northstar
    - id: "@specs/auth"
      level: 1
      type: spec
      
  edges:
    - from: "@northstar"
      to: "@specs/auth"
      type: influences
      
  visualization:
    layout: dagre
    direction: TB
```

### When to Read This

- **Building dashboard**: Cascade graph component
- **Understanding deps**: Visual spec relationships
- **Debugging**: Trace cascade flow

### Related SIPs

- SIP 36: UI Specification
- SIP 48: Dependency Graph
- SIP 55: Cascade Triggers

## Abstract

The Cascade Graph visualizes spec dependencies and cascade triggers in an interactive graph format, allowing users to understand how specs relate and how changes propagate through the system.

## Motivation

Users need:
- **Visual deps**: See spec relationships
- **Impact analysis**: What changes when X changes?
- **Debugging**: Trace cascade failures

## Rationale

**Graph Visualization:**

1. Nodes = specs
2. Edges = dependencies/refs
3. Layout = hierarchical (dagre)
4. Interaction = zoom, pan, click

## Specification

### Component Structure

```yaml
CascadeGraphComponent:
  header:
    id: "@specs/ui-cascade-graph"
    version: 1.0.0
    layer: 6
    tags: [ui, cascade, graph, visualization]
    
  layout:
    type: full_width
    height: 500px
    position: main_content
    
  features:
    - zoom_pan
    - node_click
    - highlight_path
    - filter_by_level
```

### Data Structure

```yaml
GraphData:
  nodes:
    - id: string           # Spec ID
      label: string       # Display name
      level: integer      # Layer level
      type: string        # northstar | spec | generated
      status: string      # current | stale | error
      
  edges:
    - from: string         # Source node ID
      to: string           # Target node ID
      type: string        # depends_on | refs | parent | triggers
      strength: string    # hard | soft
```

### Node Types

```yaml
NodeTypes:
  northstar:
    color: "#6366f1"      # Indigo
    shape: diamond
    size: 60
    
  spec:
    color: "#22c55e"      # Green
    shape: rectangle
    size: 40
    
  generated:
    color: "#94a3b8"      # Gray
    shape: rectangle
    size: 35
    
  current:
    border: "#22c55e"
    width: 3
    
  stale:
    border: "#eab308"
    width: 2
    
  error:
    border: "#ef4444"
    width: 3
```

### Edge Types

```yaml
EdgeTypes:
  depends_on:
    color: "#3b82f6"      # Blue
    style: solid
    arrow: normal
    
  refs:
    color: "#94a3b8"      # Gray
    style: dashed
    arrow: normal
    
  parent:
    color: "#8b5cf6"      # Purple
    style: solid
    arrow: normal
    
  triggers:
    color: "#f59e0b"      # Amber
    style: dotted
    arrow: triangle
```

### Graph Query API

```python
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional
from enum import Enum

class NodeType(Enum):
    NORTHSTAR = "northstar"
    SPEC = "spec"
    GENERATED = "generated"

class EdgeType(Enum):
    DEPENDS_ON = "depends_on"
    REFS = "refs"
    PARENT = "parent"
    TRIGGERS = "triggers"

@dataclass
class GraphNode:
    id: str
    label: str
    level: int
    node_type: NodeType
    status: str = "current"
    path: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "label": self.label,
            "level": self.level,
            "type": self.node_type.value,
            "status": self.status,
            "path": self.path
        }

@dataclass
class GraphEdge:
    from_id: str
    to_id: str
    edge_type: EdgeType
    strength: str = "hard"
    
    def to_dict(self) -> dict:
        return {
            "from": self.from_id,
            "to": self.to_id,
            "type": self.edge_type.value,
            "strength": self.strength
        }

@dataclass
class CascadeGraph:
    nodes: List[GraphNode] = field(default_factory=list)
    edges: List[GraphEdge] = field(default_factory=list)
    
    def add_node(self, node: GraphNode):
        self.nodes.append(node)
        
    def add_edge(self, edge: GraphEdge):
        self.edges.append(edge)
        
    def to_dict(self) -> dict:
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges]
        }

class GraphQueryService:
    def __init__(self, db_path: str):
        self.db_path = db_path
        
    async def get_graph(
        self,
        levels: Optional[List[int]] = None,
        node_types: Optional[List[NodeType]] = None
    ) -> CascadeGraph:
        """Get cascade graph with optional filtering."""
        
        graph = CascadeGraph()
        
        nodes = await self._query_nodes(levels, node_types)
        for node in nodes:
            graph.add_node(node)
        
        edges = await self._query_edges([n.id for n in nodes])
        for edge in edges:
            graph.add_edge(edge)
        
        return graph
    
    async def get_impact(
        self,
        spec_id: str,
        include_transitive: bool = True
    ) -> List[str]:
        """Get specs impacted by a change."""
        
        impacted = set()
        to_process = [spec_id]
        
        while to_process:
            current = to_process.pop()
            
            # Get direct dependents
            dependents = await self._get_dependents(current)
            
            for dep in dependents:
                if dep not in impacted:
                    impacted.add(dep)
                    if include_transitive:
                        to_process.append(dep)
        
        return list(impacted)
    
    async def get_dependencies(
        self,
        spec_id: str,
        include_transitive: bool = True
    ) -> List[str]:
        """Get specs that a spec depends on."""
        
        dependencies = set()
        to_process = [spec_id]
        
        while to_process:
            current = to_process.pop()
            
            deps = await self._get_dependencies(current)
            
            for dep in deps:
                if dep not in dependencies:
                    dependencies.add(dep)
                    if include_transitive:
                        to_process.append(dep)
        
        return list(dependencies)
    
    async def _query_nodes(
        self,
        levels: Optional[List[int]],
        node_types: Optional[List[NodeType]]
    ) -> List[GraphNode]:
        """Query nodes from database."""
        
        # Implementation would query SQLite
        pass
    
    async def _query_edges(self, node_ids: List[str]) -> List[GraphEdge]:
        """Query edges from database."""
        
        # Implementation would query SQLite
        pass
    
    async def _get_dependents(self, spec_id: str) -> List[str]:
        """Get direct dependents of a spec."""
        
        # Implementation would query SQLite
        pass
    
    async def _get_dependencies(self, spec_id: str) -> List[str]:
        """Get direct dependencies of a spec."""
        
        # Implementation would query SQLite
        pass
```

### Graph Visualization

```javascript
class CascadeGraphView {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      layout: options.layout || 'dagre',
      direction: options.direction || 'TB',
      zoomEnabled: options.zoomEnabled !== false,
      panEnabled: options.panEnabled !== false,
      nodeClick: options.nodeClick || this.handleNodeClick.bind(this),
      ...options
    };
    
    this.graph = null;
    this.svg = null;
  }
  
  async render(graphData) {
    // Initialize SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
    
    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.svg.select('g').attr('transform', event.transform);
      });
    
    if (this.options.zoomEnabled) {
      this.svg.call(zoom);
    }
    
    // Create container for graph
    const g = this.svg.append('g');
    
    // Apply layout
    const layout = this.createLayout(graphData);
    
    // Draw edges
    this.drawEdges(g, layout);
    
    // Draw nodes
    this.drawNodes(g, layout);
  }
  
  createLayout(graphData) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({
      rankdir: this.options.direction,
      nodesep: 50,
      ranksep: 80,
      marginx: 20,
      marginy: 20
    });
    
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Add nodes
    for (const node of graphData.nodes) {
      dagreGraph.setNode(node.id, {
        label: node.label,
        width: this.getNodeWidth(node),
        height: this.getNodeHeight(node),
        type: node.type,
        status: node.status
      });
    }
    
    // Add edges
    for (const edge of graphData.edges) {
      dagreGraph.setEdge(edge.from, edge.to, {
        type: edge.type,
        strength: edge.strength
      });
    }
    
    // Run layout
    dagre.layout(dagreGraph);
    
    return dagreGraph;
  }
  
  drawNodes(container, layout) {
    const nodes = container.selectAll('.node')
      .data(layout.nodes())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => {
        const node = layout.node(d);
        return `translate(${node.x - node.width/2}, ${node.y - node.height/2})`;
      })
      .on('click', (event, d) => {
        this.options.nodeClick(d);
      });
    
    // Node shapes based on type
    nodes.each(function(d) {
      const nodeData = layout.node(d);
      const type = nodeData.type;
      
      if (type === 'northstar') {
        d3.select(this).append('polygon')
          .attr('points', '0,-20 20,0 0,20 -20,0')
          .attr('fill', '#6366f1');
      } else {
        d3.select(this).append('rect')
          .attr('width', nodeData.width)
          .attr('height', nodeData.height)
          .attr('rx', 4)
          .attr('fill', type === 'spec' ? '#22c55e' : '#94a3b8');
      }
    });
    
    // Labels
    nodes.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .text(d => layout.node(d).label)
      .attr('fill', 'white')
      .attr('font-size', '12px');
  }
  
  drawEdges(container, layout) {
    const edges = layout.edges().map(e => ({
      ...e,
      ...layout.edge(e)
    }));
    
    const edgeLines = container.selectAll('.edge')
      .data(edges)
      .enter()
      .append('path')
      .attr('class', 'edge')
      .attr('d', d => {
        const points = this.getEdgePoints(d);
        return this.lineGenerator(points);
      })
      .attr('fill', 'none')
      .attr('stroke', d => this.getEdgeColor(d.type))
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');
  }
  
  getEdgeColor(type) {
    const colors = {
      'depends_on': '#3b82f6',
      'refs': '#94a3b8',
      'parent': '#8b5cf6',
      'triggers': '#f59e0b'
    };
    return colors[type] || '#94a3b8';
  }
  
  lineGenerator(d3) {
    return d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis);
  }
  
  handleNodeClick(node) {
    console.log('Node clicked:', node);
    // Emit event or navigate to spec
  }
  
  getNodeWidth(node) {
    return node.type === 'northstar' ? 60 : 40;
  }
  
  getNodeHeight(node) {
    return node.type === 'northstar' ? 40 : 30;
  }
}
```

### Component Integration

```python
class CascadeGraphEndpoint:
    def __init__(self, query_service: GraphQueryService):
        self.query_service = query_service
        
    async def handle(self, request) -> Response:
        """Handle graph data request."""
        
        levels = request.query.get('levels')
        if levels:
            levels = [int(l) for l in levels.split(',')]
        
        node_types = request.query.get('types')
        if node_types:
            node_types = [NodeType(t) for t in node_types.split(',')]
        
        graph = await self.query_service.get_graph(levels, node_types)
        
        return Response(
            status_code=200,
            body=json.dumps(graph.to_dict())
        )
```

## Backwards Compatibility

- Graph API backwards compatible
- New node/edge types handled gracefully

## Security Implications

- Graph may expose spec relationships
- Consider access control for sensitive specs

## References

- @ref:specs/ui-specification
- @ref:specs/dependency-graph
- SIP 36: UI Specification
- SIP 48: Dependency Graph
- SIP 55: Cascade Triggers

## Copyright

This document is in the public domain.
