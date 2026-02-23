# Bootstrap Phase 6.10: Control Panel Component

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.10 of the bootstrap process.

**Prerequisites**: 
- Phase 6.1-6.5 (UI Dashboard, Components, State, Individual Components, Testing) complete
- Component patterns established in phase-6.4
- Visual design system defined

## Your Task
Implement the Control Panel component as a standalone, production-ready React component.

## Read These Specs First
1. `specs/ui.spec.dir/components/control-panel.spec.md` - Full component specification

## What to Build

### File to Create
```
src/ui/components/
├── control-panel.tsx       # Complete component implementation
```

### Requirements

#### Props Interface
```typescript
interface TriggerOptions {
  targetFile?: string;
  force?: boolean;
  dryRun?: boolean;
}

interface ControlPanelProps {
  cascadeActive: boolean;
  cascadeConverged: boolean;
  queueDepth: number;
  agentCount: number;
  onTriggerCascade: (options: TriggerOptions) => Promise<void>;
  onPauseCascade: () => Promise<void>;
  onResumeCascade: () => Promise<void>;
  onFinalizeCascade: () => Promise<void>;
  onStepCascade: () => Promise<void>;
  onAbortCascade: () => Promise<void>;
  onOpenSettings: () => void;
  availableTargets: string[];
  defaultTarget: string | null;
  confirmDestructiveActions: boolean;
  showAdvancedControls: boolean;
  isLoading: boolean;
  error: Error | null;
}
```

#### Features
1. **Status Bar**: Shows cascade state, queue depth, agent count
2. **Trigger Button**: Opens target selector modal
3. **Pause/Resume Button**: Toggle cascade pause state
4. **Step Button**: Single cascade step
5. **Finalize Button**: Mark specs as converged (requires confirmation)
6. **Abort Button**: Stop cascade (requires confirmation)
7. **Settings Button**: Open settings
8. **Target Selector**: Choose specific file/target
9. **Advanced Options**: Force, dry-run checkboxes
10. **Confirmation Dialog**: For destructive actions

#### Visual Design (from spec)
- Status indicators: Active (red), Idle (gray)
- Button styles: Safe (default), Warning (pause), Destructive (abort)
- Confirmation dialogs for finalize/abort
- Loading states for all actions

### Implementation

Write the complete `src/ui/components/control-panel.tsx` file following:
- Use React with useState, useCallback
- Follow the props interface above
- Implement modal for target selection
- Implement confirmation dialogs
- Handle loading states
- Use CSS variables for theming
- Include TypeScript types

## Test Cases
1. Shows correct status when idle
2. Shows correct status when active
3. Trigger opens target selector
4. Target selector shows all targets
5. Pause/Resume toggles correctly
6. Step advances one step
7. Finalize shows confirmation dialog
8. Abort shows confirmation dialog
9. Confirm dialog triggers action
10. Cancel closes dialog
11. Settings button works
12. Loading states display correctly

## Validation
```bash
bun test tests/ui/components/control-panel.test.tsx
```

## Output Format
After completing, output:
1. control-panel.tsx implemented
2. All test cases passing
