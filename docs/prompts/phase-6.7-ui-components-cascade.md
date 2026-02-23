# Bootstrap Phase 6.7: Cascade Graph Component

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.7 of the bootstrap process.

**Prerequisites**: 
- Phase 6.1-6.5 (UI Dashboard, Components, State, Individual Components, Testing) complete
- Component patterns established in phase-6.4
- Visual design system defined

## Your Task
Implement the Cascade Graph component as a standalone, production-ready React component.

## Read These Specs First
1. `specs/ui.spec.dir/components/cascade-graph.spec.md` - Full component specification

## What to Build

### File to Create
```
src/ui/components/
├── cascade-graph.tsx       # Complete component implementation
```

### Requirements

#### Props Interface
```typescript
interface CascadeNode {
  id: string;
  type: 'spec' | 'file' | 'agent';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  label: string;
  layer?: number;
}

interface CascadeEdge {
  source: string;
  target: string;
  type: 'dependency' | 'trigger';
}

interface CascadeGraphProps {
  nodes: CascadeNode[];
  edges: CascadeEdge[];
  highlightPath?: string[];
  onNodeClick?: (nodeId: string) => void;
  zoomLevel: number;
  showLabels: boolean;
  layout: 'tree' | 'force' | 'radial';
}
```

#### Features
1. **Node Rendering**: Circles for each node with status color
2. **Edge Rendering**: Directed edges between nodes with arrowheads
3. **Layout Modes**: 
   - Tree: Nodes grouped by layer
   - Radial: Circular arrangement
   - Force: Grid-based layout
4. **Zoom**: Scale transformation
5. **Labels**: Toggle node labels
6. **Highlight Path**: Highlight specific node chains
7. **Click Handling**: Node click callback
8. **Legend**: Status color legend

#### Visual Design (from spec)
- Status colors: completed=green, processing=accent, failed=red, pending=gray
- Node size: 40px diameter (r=20)
- Edge: 1px stroke, 2px when highlighted
- Highlighted nodes: 3px accent stroke
- Arrow markers for direction

### Implementation

Write the complete `src/ui/components/cascade-graph.tsx` file following:
- Use React with useRef, useEffect, useState
- SVG-based rendering
- Follow the props interface above
- Implement tree, radial, and force layouts
- Handle zoom transformation
- Use CSS variables for theming
- Include TypeScript types

## Test Cases
1. Renders empty graph
2. Renders nodes with correct positions
3. Renders edges between nodes
4. Tree layout groups by layer
5. Radial layout positions in circle
6. Force layout shows grid
7. Zoom level scales graph
8. Labels toggle works
9. Highlight path highlights nodes
10. Node click calls callback

## Validation
```bash
bun test tests/ui/components/cascade-graph.test.tsx
```

## Output Format
After completing, output:
1. cascade-graph.tsx implemented
2. All test cases passing
