# speclang-header lines:13
id: "@speclang/ui.interactions"
parent: "@ref:specs/ui"part: 11/14
siblings:
  prev: "@ref:specs/ui.spec.dir/components/log-viewer"
next: "@ref:specs/ui.spec.dir/state-management"short: User interactions and control flows
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 0
---

## Interactions

### @ui/interactions-cascade-control

```speclang
# @block:ui/interactions-cascade-control @kind:operation
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

### @ui/interactions-spec-editing

```speclang
# @block:ui/interactions-spec-editing @kind:operation
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

### @ui/interactions-real-time-updates

```speclang
# @block:ui/interactions-real-time-updates @kind:operation
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

### @ui/interactions-git-integration

```speclang
# @block:ui/interactions-git-integration @kind:operation
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
