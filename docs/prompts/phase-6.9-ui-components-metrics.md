# Bootstrap Phase 6.9: Metrics Components

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.9 of the bootstrap process.

**Prerequisites**: 
- Phase 6.1-6.5 (UI Dashboard, Components, State, Individual Components, Testing) complete
- Component patterns established in phase-6.4
- Visual design system defined

## Your Task
Implement the Metrics components (System Metrics and Queue Depth) as standalone, production-ready React components.

## Read These Specs First
1. `specs/ui.spec.dir/components/system-metrics.spec.md` - System metrics component
2. `specs/ui.spec.dir/components/queue-depth.spec.md` - Queue depth component

## What to Build

### Files to Create
```
src/ui/components/
├── system-metrics.tsx       # System resource metrics
├── queue-depth.tsx          # Queue depth visualization
```

### Requirements

#### System Metrics Props
```typescript
interface SystemMetricsProps {
  cpu: number;
  memory: { used: number; total: number };
  disk: { used: number; total: number };
  network: { in: number; out: number };
  uptime: number;
}
```

#### Queue Depth Props
```typescript
interface QueueDepthProps {
  current: number;
  max: number;
  history: Array<{ time: string; depth: number }>;
  showHistory: boolean;
}
```

#### Features - System Metrics
1. **CPU Display**: Percentage with progress bar
2. **Memory Display**: Used/total with percentage bar
3. **Disk Display**: Used/total with percentage bar
4. **Network Display**: In/out bandwidth
5. **Uptime Display**: Formatted uptime string
6. **Color Coding**: Red when >80%, accent otherwise

#### Features - Queue Depth
1. **Current/Max Display**: Numeric display
2. **Progress Bar**: Visual fill percentage
3. **Color Coding**: Error >80%, warning >50%, success otherwise
4. **History Sparkline**: Mini chart of recent depth
5. **History Toggle**: Show/hide sparkline

### Implementation

Write the complete components following:
- Use React functional components
- Follow the props interfaces above
- Format bytes (B, KB, MB, GB)
- Format uptime (d/h/m)
- Use CSS variables for theming
- Include TypeScript types

## Test Cases

### System Metrics
1. Renders CPU percentage correctly
2. Renders memory with correct percentage
3. Renders disk with correct percentage
4. Network displays in/out
5. Uptime formatted correctly
6. Color changes at 80% threshold

### Queue Depth
1. Renders current/max correctly
2. Progress bar shows percentage
3. Colors change at thresholds
4. Sparkline displays history
5. Toggle shows/hides sparkline

## Validation
```bash
bun test tests/ui/components/system-metrics.test.tsx
bun test tests/ui/components/queue-depth.test.tsx
```

## Output Format
After completing, output:
1. system-metrics.tsx implemented
2. queue-depth.tsx implemented
3. All test cases passing
