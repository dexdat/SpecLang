---
id: "@speclang/ui-dashboard/interactions"
parent: ""@ref:specs/ui-dashboard"short: "UI interaction handlers and event management"
project_level: Alpha
agent_support: agent_assisted
tags: [ui, dashboard, interactions, events]
version: 0.1.0
layer: 5
---

# UI Dashboard Interactions

Interaction handlers for the SpecLang dashboard.

## Event Handlers

### @ui/interactions/handlers

Handles user interactions in the dashboard.

**Responsibilities:**
- Process user input events
- Manage drag-and-drop operations
- Handle keyboard shortcuts
- Coordinate with cascade control

**Dependencies:**
- @ref:specs/ui-dashboard/spec-editor
- @ref:specs/cascade#triggers

## Drag and Drop

### @ui/interactions/drag-drop

Drag and drop functionality for spec files.

**Features:**
- Reorder specs in cascade view
- Move files between directories
- Visual feedback during drag

## Keyboard Shortcuts

### @ui/interactions/keyboard

Global keyboard shortcuts for the dashboard.

**Shortcuts:**
- `Cmd/Ctrl + S`: Save current spec
- `Cmd/Ctrl + B`: Trigger build
- `Cmd/Ctrl + Shift + R`: Reload cascade
- `Esc`: Cancel current operation
