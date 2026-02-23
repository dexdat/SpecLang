# Bootstrap Phase 6.6: Agent Health Component

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.6 of the bootstrap process.

**Prerequisites**: 
- Phase 6.1-6.5 (UI Dashboard, Components, State, Individual Components, Testing) complete
- Component patterns established in phase-6.4
- Visual design system defined

## Your Task
Implement the Agent Health Grid component as a standalone, production-ready React component.

## Read These Specs First
1. `specs/ui.spec.dir/components/agent-health.spec.md` - Full component specification

## What to Build

### File to Create
```
src/ui/components/
├── agent-health-grid.tsx       # Complete component implementation
```

### Requirements

#### Props Interface
```typescript
interface AgentStatus {
  id: string;
  type: 'spec-writer' | 'code-gen' | 'test-writer' | 'north-star';
  status: 'idle' | 'active' | 'error' | 'paused';
  currentFile: string | null;
  queueDepth: number;
  uptimeSeconds: number;
  lastActive: string;
  performance: {
    processingTimeAvg: number;
    successRate: number;
    errorCount: number;
  };
  sessionId: string;
}

interface AgentFilters {
  type: string | null;
  status: string[] | null;
  search: string;
}

interface AgentHealthGridProps {
  agents: AgentStatus[];
  agentTypes: string[];
  filterByType: string | null;
  filterByStatus: string[] | null;
  searchQuery: string;
  onAgentClick: (agentId: string) => void;
  onRestartAgent: (agentId: string) => Promise<void>;
  onPauseAgent: (agentId: string) => Promise<void>;
  onDebugAgent: (agentId: string) => void;
  onFilterChange: (filters: AgentFilters) => void;
  autoRefresh: boolean;
  refreshInterval: number;
  showHeatmap: boolean;
  compactView: boolean;
  isLoading: boolean;
  error: Error | null;
}
```

#### Features
1. **Grid Layout**: Responsive grid with cards
2. **Filtering**: By type, status, and search query
3. **Sorting**: By type, status, queue depth, uptime
4. **Expansion**: Click card to show details
5. **Actions**: Restart, pause, debug buttons
6. **Visual Status**: Color-coded status indicators (idle=gray, active=red border, error=red, paused=strikethrough)
7. **Heatmap**: Optional activity heatmap
8. **Loading State**: Skeleton loading for initial load
9. **Error State**: Error display with retry

#### Visual Design (from spec)
- Grid with exposed grid lines background
- No rounded corners - sharp brutalist edges
- 1px solid borders separating cells
- Hover reveals red border
- Card entry: brutalist-slide animation
- Status indicator pulses when active

### Implementation

Write the complete `src/ui/components/agent-health-grid.tsx` file following:
- Use React hooks (useState, useEffect, useMemo, useCallback)
- Follow the props interface above
- Implement filtering, sorting, expansion
- Handle loading/error states
- Use CSS variables for theming
- Include TypeScript types

## Test Cases
1. Renders empty state when no agents
2. Renders all agents in grid
3. Filters by type correctly
4. Filters by status correctly  
5. Filters by search query
6. Sorts by each column asc/desc
7. Expands card on click
8. Shows details in expanded view
9. Restart button calls callback
10. Pause button calls callback
11. Loading skeleton displays
12. Error state with retry works

## Validation
```bash
bun test tests/ui/components/agent-health-grid.test.tsx
```

## Output Format
After completing, output:
1. agent-health-grid.tsx implemented
2. All test cases passing
