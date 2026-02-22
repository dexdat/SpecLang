# speclang-header lines:14
id: "@speclang/ui.components.control-panel"
parent: "@ref:specs/ui"
part: 8/14
siblings:
  prev: "@ref:specs/ui.dir/components/system-metrics"
  next: "@ref:specs/ui.dir/components/cascade-graph"
short: Control panel component for cascade operations
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 3
---

### @ui/component-control-panel

```speclang
# @block:ui/component-control-panel @kind:entity
ControlPanel:
  purpose: Centralized controls for cascade operations (trigger, pause, finalize, step mode)
  
  visual_design:
    layout: "Grid of large action buttons, grouped by function (trigger, control, destructive)"
    colors:
      safe_action: "var(--color-success) green border"
      warning_action: "var(--color-warning) yellow border"
      destructive_action: "var(--color-error) red border"
      disabled_state: "var(--color-text-muted) gray border"
    typography:
      button_label: "var(--font-display) 16px uppercase"
      button_description: "var(--font-body) 11px"
    effects:
      - "Buttons have 2px solid borders, no background fill"
      - "Hover reveals solid fill with border color"
      - "Disabled buttons have strikethrough text"
    animations:
      - "Button press effect: border thickness increases momentarily"
      - "Confirmation dialog slides in from top"
      - "Destructive actions trigger warning pulse"
  
  props_interface:
    ```typescript
    interface ControlPanelProps {
      // System state
      cascadeActive: boolean;
      cascadeConverged: boolean;
      queueDepth: number;
      agentCount: number;
      
      // Callbacks
      onTriggerCascade: (options: TriggerOptions) => Promise<void>;
      onPauseCascade: () => Promise<void>;
      onResumeCascade: () => Promise<void>;
      onFinalizeCascade: () => Promise<void>;
      onStepCascade: () => Promise<void>;
      onAbortCascade: () => Promise<void>;
      onOpenSettings: () => void;
      
      // Configuration
      availableTargets: string[]; // Files that can be triggered
      defaultTarget: string | null;
      confirmDestructiveActions: boolean;
      showAdvancedControls: boolean;
      
      // UI state
      isLoading: boolean;
      error: Error | null;
    }
    
    interface TriggerOptions {
      targetFile?: string;
      force?: boolean;
      dryRun?: boolean;
    }
    ```
  state_interface:
    ```typescript
    interface ControlPanelState {
      // UI state
      selectedTarget: string | null;
      showTargetSelector: boolean;
      showConfirmation: { action: string, message: string } | null;
      expandedSection: string | null; // basic, advanced, diagnostics
      
      // Async operation state
      isTriggering: boolean;
      isPausing: boolean;
      isFinalizing: boolean;
      isStepping: boolean;
      isAborting: boolean;
      
      // Options state
      triggerOptions: TriggerOptions;
      
      // Error state
      lastActionError: Error | null;
    }
    ```
  lifecycle_methods:
    - componentDidMount: Load available targets from MCP
    - componentWillUnmount: Cancel pending actions
  
  event_handlers:
    - handleTriggerClick: Show target selector → validate → confirm → call onTriggerCascade
    - handlePauseResumeClick: Toggle → call appropriate callback
    - handleFinalizeClick: Show confirmation → call onFinalizeCascade
    - handleStepClick: Call onStepCascade → update UI
    - handleAbortClick: Show severe confirmation → call onAbortCascade
    - handleTargetSelect: Update selected target
  
  rendering_logic:
    - Grid of large, clear action buttons
    - Color coding: green (safe), yellow (warning), red (destructive)
    - Disabled states based on preconditions
    - Loading spinners during async operations
    - Confirmation dialogs for destructive actions
    - Advanced controls collapsible section
  
  error_boundary:
    - Catches errors in action execution
    - Shows error details with retry option
    - Prevents panel from becoming unusable
  
  performance_optimizations:
    - Memoize button disabled states
    - Throttle rapid clicks
    - Lazy load advanced controls
  
  accessibility_requirements:
    - Button ARIA labels with action descriptions
    - Keyboard navigation between buttons
    - Screen reader announcements for state changes
    - Focus management for confirmation dialogs
  
  test_specifications:
    - Unit tests: render with various system states
    - Interaction tests: all button click handlers
    - Confirmation tests: destructive action confirmations
    - Error tests: error recovery
    - Accessibility tests: keyboard navigation
```
