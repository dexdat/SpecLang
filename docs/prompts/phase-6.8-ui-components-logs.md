# Bootstrap Phase 6.8: Log Viewer Component

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.8 of the bootstrap process.

**Prerequisites**: 
- Phase 6.1-6.5 (UI Dashboard, Components, State, Individual Components, Testing) complete
- Component patterns established in phase-6.4
- Visual design system defined

## Your Task
Implement the Log Viewer component as a standalone, production-ready React component.

## Read These Specs First
1. `specs/ui.spec.dir/components/log-viewer.spec.md` - Full component specification

## What to Build

### File to Create
```
src/ui/components/
├── log-viewer.tsx       # Complete component implementation
```

### Requirements

#### Props Interface
```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

interface LogViewerProps {
  logs: LogEntry[];
  maxLines?: number;
  filterLevel?: LogEntry['level'][];
  filterSource?: string;
  searchQuery?: string;
  follow?: boolean;
  showTimestamp: boolean;
  showMetadata: boolean;
  onLogClick?: (entry: LogEntry) => void;
  onClear?: () => void;
  onExport?: () => void;
}
```

#### Features
1. **Log Display**: Scrollable list of log entries
2. **Level Filtering**: Filter by debug/info/warn/error
3. **Source Filtering**: Filter by log source
4. **Search**: Full-text search in message and metadata
5. **Auto-scroll**: Follow new logs (toggleable)
6. **Timestamps**: Optional timestamp display
7. **Metadata**: Optional metadata expansion
8. **Clear**: Clear logs button
9. **Export**: Export logs to file

#### Visual Design (from spec)
- Level colors: error=red, warn=orange, debug=gray, info=white
- Monospace font for log content
- Toolbar with filters at top
- Scrollable container
- Clickable entries for detail view

### Implementation

Write the complete `src/ui/components/log-viewer.tsx` file following:
- Use React with useRef, useEffect, useState, useMemo
- Virtual scrolling for performance
- Follow the props interface above
- Implement filtering and search
- Handle auto-scroll
- Use CSS variables for theming
- Include TypeScript types

## Test Cases
1. Renders empty state
2. Renders all log entries
3. Filters by level correctly
4. Filters by source correctly
5. Search filters entries
6. Auto-scroll follows new logs
7. Toggle auto-scroll works
8. Clear button clears logs
9. Export downloads logs
10. Click entry shows details
11. Timestamps display correctly
12. Metadata displays when enabled

## Validation
```bash
bun test tests/ui/components/log-viewer.test.tsx
```

## Output Format
After completing, output:
1. log-viewer.tsx implemented
2. All test cases passing
