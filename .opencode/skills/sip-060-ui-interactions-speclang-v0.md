---
name: sip-060-ui-interactions-speclang-v0
title: "SIP 60: UI Interactions"
version: 0.1.0
description: User interaction patterns and event handling for Speclang UI
category: standard
---

# SIP 60: UI Interactions

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines user interaction patterns and event handling for Speclang UI.

### Quick Start

1. **Cascade Control:** Trigger, pause, resume, finalize, abort
2. **Spec Editing:** Create, edit, add blocks, add references
3. **Real-time Updates:** SSE connection, optimistic updates
4. **Git Integration:** Commit view, history, branches, conflicts

### Example

```typescript
// Trigger cascade
<Button onClick={() => mcpClient.insertCommand({ action: 'trigger' })}>
  Trigger Cascade
</Button>

// Pause/resume
<Button onClick={() => mcpClient.insertCommand({ action: 'pause' })}>
  Pause
</Button>
```

### Key Concepts

- **SSE:** Server-Sent Events for real-time updates
- **Optimistic UI:** Immediate feedback before server response
- **Debouncing:** Batch rapid events
- **Offline Support:** Queue actions when disconnected

### When to Read This

- **Building UI:** Understanding interaction flows
- **Event Handling:** Implementing real-time updates
- **Git Integration:** Adding version control

### Related SIPs

- SIP 36: UI
- SIP 57: UI State
- SIP 50: MCP Tools

## Abstract

This SIP defines the interaction patterns for Speclang UI, including cascade control, spec editing workflows, real-time update handling, and git integration.

## Motivation

UI needs:
- Intuitive cascade control
- Efficient spec editing
- Real-time feedback
- Version control integration

## Rationale

**Interaction Flow:**

```
User Action → Optimistic UI → MCP Command → Server Response → Update State
```

**Benefits:**
- Responsive feel
- Consistent patterns
- Error recovery
- Git workflow integration

## Specification

### Cascade Control Interactions

**@ui/interactions-cascade-control:**

```speclang
cascade_control_interactions():

steps:
  1. User clicks trigger button or uses shortcut
  2. System sends speclang_insert_command with action "trigger"
  3. UI shows toast notification "Cascade triggered"
  4. User can pause/resume with toggle button
  5. System sends pause/resume command
  6. Button icon and color update visually
  7. User can finalize cascade with confirmation button
  8. System runs pipeline and commits changes
  9. User can step through cascade step-by-step
  10. System updates UI after each step
  11. User can abort cascade with emergency stop
  12. System rolls back changes after confirmation

  trigger_cascade:
    trigger: button click or shortcut
    action: speclang_insert_command(action: "trigger", target_file: current_file)
    feedback: toast notification "Cascade triggered"

  pause_resume:
    toggle button
    action: speclang_insert_command(action: "pause"/"resume")
    visual: button changes icon and color

  finalize:
    button with confirmation
    action: speclang_insert_command(action: "finalize")
    result: runs pipeline, commits changes

  step_mode:
    advanced control: execute one cascade step
    action: speclang_insert_command(action: "step")
    updates UI after each step

  abort_cascade:
    emergency stop with rollback
    confirmation required
    action: speclang_insert_command(action: "abort")
```

### Spec Editing Workflow

**@ui/interactions-spec-editing:**

```speclang
spec_editing_workflow():

steps:
  1. User clicks "New Spec" button or right-clicks in file tree
  2. Dialog prompts for id, layer, tags
  3. System generates header template with required fields
  4. Editor opens for further editing
  5. User double-clicks existing spec to edit
  6. Editor opens with syntax highlighting
  7. Auto-save optional, manual save button available
  8. Real-time validation prevents save on errors
  9. User clicks "Add Block" button or uses shortcut
  10. Form prompts for block id, kind, attributes
  11. System inserts template block at cursor
  12. User types @ref: to trigger autocomplete
  13. System shows search results for references
  14. Click inserts full reference
  15. Validation checks reference exists in database
  16. User can preview changes in split view
  17. Preview updates on pause typing
  18. Preview shows rendered blocks

  create_new_spec:
    via: "New Spec" button or right-click in file tree
    dialog: asks for id, layer, tags
    template: generates header with required fields
    opens: in editor for further editing

  edit_existing_spec:
    double-click in file tree or search results
    editor opens with syntax highlighting
    auto-save: optional, with manual save button
    validation: real-time, errors prevent save

  add_block:
    button: "Add Block" or shortcut
    form: block id, kind, attributes
    inserts: template block at cursor

  add_ref:
    autocomplete: typing @ref: shows search results
    click: inserts full ref
    validation: checks ref exists in database

  preview_changes:
    split view: edit | preview
    preview updates on pause typing
    shows rendered blocks
```

### Real-time Update Handling

**@ui/interactions-real-time-updates:**

```speclang
real_time_update_handling():

steps:
  1. Establish SSE connection to MCP server /events endpoint
  2. Listen for file.changed events, update file tree and cascade visualization
  3. Listen for agent.spawned events, update agent monitor
  4. Listen for agent.completed events, update agent card and timeline
  5. Listen for cascade.converged events, show notification and update dashboard
  6. Listen for command.executed events, update command history
  7. When user triggers action, show optimistic UI change immediately
  8. If action fails, rollback with error message
  9. Batch rapid events (like file changes during cascade) with debouncing
  10. Show visual "updating..." state during batch processing
  11. Queue actions when offline, sync when reconnected
  12. Show connection status indicator

  sse_connection:
    establish: connect to MCP server /events endpoint
    events:
      - file.changed: update file tree, cascade visualization
      - agent.spawned: update agent monitor
      - agent.completed: update agent card, timeline
      - cascade.converged: show notification, update dashboard
      - command.executed: update command history

  optimistic_updates:
    when user triggers action, show immediate UI change
    if action fails, rollback with error message

  debounced_updates:
    rapid events (like file changes during cascade) batched
    visual indicators show "updating..." state

  offline_support:
    queue actions when disconnected
    sync when reconnected
    show connection status indicator
```

### Git Integration

**@ui/interactions-git-integration:**

```speclang
git_integration():

steps:
  1. Show git status of spec files only in commit view
  2. Provide checkboxes per file for staging
  3. Prefill commit message with "speclang: " prefix
  4. Commit via speclang_insert_command with action "git_commit"
  5. Visualize git log in history view
  6. Filter by speclang commits only
  7. Click commit to show diff of spec files
  8. Option to revert specific commit
  9. Create branch from current state
  10. Switch branches with warning about uncommitted changes
  11. Show merge visualization
  12. When git pull causes conflicts, show visual diff tool for spec files
  13. Provide merge assistance with block-level resolution

  commit_view:
    shows: git status of spec files only
    staging: checkboxes per file
    commit_message: prefilled with "speclang: " prefix
    commit: via speclang_insert_command(action: "git_commit")

  history_view:
    git log visualization
    filter by speclang commits only
    click commit: show diff of spec files
    revert: option to revert specific commit

  branch_management:
    create branch from current state
    switch branches (warns about uncommitted changes)
    merge visualization

  conflict_resolution:
    when git pull causes conflicts
    visual diff tool for spec files
    merge assistance with block-level resolution
```

## Implementation

### Cascade Control Component

```typescript
function CascadeControls() {
  const { active, depth } = useCascadeStore();
  const [confirmAbort, setConfirmAbort] = useState(false);
  
  const handleTrigger = async () => {
    await mcpClient.insertCommand({ action: 'trigger' });
    toast.success('Cascade triggered');
  };
  
  const handlePause = async () => {
    await mcpClient.insertCommand({ action: 'pause' });
  };
  
  const handleFinalize = async () => {
    if (confirm('Finalize and commit changes?')) {
      await mcpClient.insertCommand({ action: 'finalize' });
    }
  };
  
  const handleAbort = async () => {
    if (confirmAbort) {
      await mcpClient.insertCommand({ action: 'abort' });
      setConfirmAbort(false);
    } else {
      setConfirmAbort(true);
      setTimeout(() => setConfirmAbort(false), 3000);
    }
  };
  
  return (
    <div className="cascade-controls">
      {!active ? (
        <Button onClick={handleTrigger}>Trigger</Button>
      ) : (
        <>
          <Button onClick={handlePause}>Pause</Button>
          <Button onClick={handleFinalize}>Finalize</Button>
          <Button variant="danger" onClick={handleAbort}>
            {confirmAbort ? 'Confirm Abort' : 'Abort'}
          </Button>
        </>
      )}
      <DepthIndicator depth={depth} />
    </div>
  );
}
```

### Spec Editor Component

```typescript
function SpecEditor() {
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  const handleAddBlock = () => {
    const block = `\n### @block:${generateId()} @kind:entity\nContent here...\n`;
    setContent(prev => prev + block);
  };
  
  const handleRefAutocomplete = useCallback(
    debounce(async (query: string) => {
      const results = await mcpClient.search(query);
      return results;
    }, 200),
    []
  );
  
  return (
    <div className="spec-editor">
      <EditorToolbar>
        <Button onClick={handleAddBlock}>Add Block</Button>
        <Button onClick={handleSave}>Save</Button>
      </EditorToolbar>
      <MonacoEditor
        value={content}
        onChange={setContent}
        onValidation={setErrors}
        autocompleteRef={handleRefAutocomplete}
      />
      {errors.length > 0 && <ValidationErrors errors={errors} />}
    </div>
  );
}
```

### SSE Connection Hook

```typescript
function useSSEConnection() {
  const [connected, setConnected] = useState(false);
  const [queued, setQueued] = useState<Command[]>([]);
  
  useEffect(() => {
    const eventSource = new EventSource('/events');
    
    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);
    
    eventSource.addEventListener('file.changed', (e) => {
      useSpecStore.getState().refreshFileTree();
    });
    
    eventSource.addEventListener('cascade.event', (e) => {
      useCascadeStore.getState().addEvent(JSON.parse(e.data));
    });
    
    return () => eventSource.close();
  }, []);
  
  const queueCommand = useCallback((cmd: Command) => {
    if (!connected) {
      setQueued(prev => [...prev, cmd]);
      return;
    }
    mcpClient.insertCommand(cmd);
  }, [connected]);
  
  useEffect(() => {
    if (connected && queued.length > 0) {
      queued.forEach(cmd => mcpClient.insertCommand(cmd));
      setQueued([]);
    }
  }, [connected, queued]);
  
  return { connected, queueCommand };
}
```

## References

- @ref:specs/ui.spec.dir/interactions
- SIP 36: UI
- SIP 57: UI State
- SIP 50: MCP Tools

## Copyright

This document is in the public domain.
