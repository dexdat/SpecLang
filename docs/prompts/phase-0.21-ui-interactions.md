# Bootstrap Phase 0.21: UI Interactions

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.21 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.20 complete
- UI components built
- State management ready
- SSE streaming operational

## Your Task
Implement user interactions and event handling for the SpecLang dashboard including cascade controls, spec editing, real-time updates, and git integration.

## Read These Specs First
1. `specs/ui.spec.dir/interactions.spec.md` - Interaction specifications
2. `specs/ui.spec.dir/state-management.spec.md` - State handling
3. `specs/ui.spec.dir/components/cascade-status.spec.md` - Cascade component
4. `specs/mcp-ui-tools.spec.md` - Backend tools

## What to Build

### Files to Create
```
src/dashboard/
├── interactions/
│   ├── cascade-control.ts
│   ├── spec-editor.ts
│   ├── real-time-updates.ts
│   └── git-integration.ts
├── handlers/
│   ├── event-handlers.ts
│   ├── keyboard-shortcuts.ts
│   └── drag-drop.ts
└── hooks/
    ├── useCascadeControl.ts
    ├── useSpecEditor.ts
    ├── useRealTimeUpdates.ts
    └── useGitIntegration.ts
```

### Requirements

#### 1. Cascade Control Interactions

```typescript
// interactions/cascade-control.ts

interface CascadeControlState {
  status: 'idle' | 'running' | 'paused' | 'finalizing';
  canPause: boolean;
  canFinalize: boolean;
  canAbort: boolean;
}

export function useCascadeControl() {
  const [state, setState] = useState<CascadeControlState>({
    status: 'idle',
    canPause: false,
    canFinalize: false,
    canAbort: false
  });

  const triggerCascade = async () => {
    await mcpClient.call('speclang_insert_command', {
      action: 'trigger',
      target_file: currentFile.value
    });
    showToast('Cascade triggered');
  };

  const pauseResume = async () => {
    const action = state.status === 'paused' ? 'resume' : 'pause';
    await mcpClient.call('speclang_insert_command', { action });
    setState(s => ({
      ...s,
      status: action === 'pause' ? 'paused' : 'running'
    }));
  };

  const stepMode = async () => {
    await mcpClient.call('speclang_insert_command', { action: 'step' });
  };

  const abortCascade = async () => {
    if (confirm('Abort cascade and rollback changes?')) {
      await mcpClient.call('speclang_insert_command', { action: 'abort' });
    }
  };

  const finalize = async () => {
    if (confirm('Finalize cascade and commit changes?')) {
      await mcpClient.call('speclang_insert_command', { action: 'finalize' });
    }
  };

  return {
    state,
    triggerCascade,
    pauseResume,
    stepMode,
    abortCascade,
    finalize
  };
}
```

#### 2. Spec Editing Workflow

```typescript
// interactions/spec-editor.ts

interface SpecEditorState {
  currentSpec: Spec | null;
  isDirty: boolean;
  validationErrors: ValidationError[];
  previewContent: string;
}

export function useSpecEditor() {
  const [state, setState] = useState<SpecEditorState>({
    currentSpec: null,
    isDirty: false,
    validationErrors: [],
    previewContent: ''
  });

  const createNewSpec = async () => {
    const { id, layer, tags } = await showNewSpecDialog();
    const template = generateHeaderTemplate({ id, layer, tags });
    setState(s => ({ ...s, currentSpec: { id, content: template }, isDirty: true }));
  };

  const editSpec = async (specId: string) => {
    const content = await mcpClient.call('speclang_get_spec', { id: specId });
    setState(s => ({ ...s, currentSpec: { id: specId, content }, isDirty: false }));
  };

  const addBlock = async () => {
    const { blockId, kind, attributes } = await showAddBlockDialog();
    const template = generateBlockTemplate({ blockId, kind, attributes });
    insertAtCursor(template);
  };

  const autocompleteRef = async (partial: string) => {
    const results = await mcpClient.call('speclang_search', { query: partial });
    return results.map(r => r.id);
  };

  const validateRef = async (ref: string) => {
    const exists = await mcpClient.call('speclang_ref_exists', { ref });
    return exists;
  };

  const saveSpec = async () => {
    if (state.validationErrors.length > 0) {
      showToast('Cannot save: validation errors', 'error');
      return;
    }
    await mcpClient.call('speclang_save_spec', {
      id: state.currentSpec!.id,
      content: state.currentSpec!.content
    });
    setState(s => ({ ...s, isDirty: false }));
    showToast('Spec saved');
  };

  return {
    state,
    createNewSpec,
    editSpec,
    addBlock,
    autocompleteRef,
    validateRef,
    saveSpec
  };
}
```

#### 3. Real-Time Updates Handler

```typescript
// interactions/real-time-updates.ts

interface SSEEvent {
  type: string;
  data: any;
  timestamp: number;
}

export function useRealTimeUpdates() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [actionQueue, setActionQueue] = useState<Action[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const source = new EventSource('/events');
    
    const handlers: Record<string, (data: any) => void> = {
      'file.changed': (data) => {
        scheduleUpdate(() => {
          fileTreeStore.refresh();
          cascadeVisualization.update();
        });
      },
      'agent.spawned': (data) => {
        agentMonitor.addAgent(data);
      },
      'agent.completed': (data) => {
        agentMonitor.updateAgent(data);
        timeline.addEvent(data);
      },
      'cascade.converged': (data) => {
        showToast('Cascade converged');
        dashboard.refresh();
      },
      'command.executed': (data) => {
        commandHistory.add(data);
      }
    };

    Object.entries(handlers).forEach(([type, handler]) => {
      source.addEventListener(type, (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        handler(data);
        setEvents(prev => [{ type, data, timestamp: Date.now() }, ...prev].slice(0, 100));
      });
    });

    source.onerror = () => {
      setIsOnline(false);
      source.close();
      setTimeout(reconnect, 5000);
    };

    return () => source.close();
  }, []);

  const scheduleUpdate = (update: () => void) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      update();
    }, 100);
  };

  const optimisticUpdate = <T,>(action: () => Promise<T>, optimistic: () => void, rollback: () => void) => {
    optimistic();
    action().catch(() => {
      rollback();
      showToast('Action failed, rolled back', 'error');
    });
  };

  const queueAction = (action: Action) => {
    if (!isOnline) {
      setActionQueue(prev => [...prev, action]);
    } else {
      executeAction(action);
    }
  };

  const flushQueue = async () => {
    for (const action of actionQueue) {
      await executeAction(action);
    }
    setActionQueue([]);
  };

  useEffect(() => {
    if (isOnline && actionQueue.length > 0) {
      flushQueue();
    }
  }, [isOnline]);

  return { events, isOnline, optimisticUpdate, queueAction };
}
```

#### 4. Git Integration

```typescript
// interactions/git-integration.ts

interface GitStatus {
  modified: string[];
  staged: string[];
  untracked: string[];
  branch: string;
  ahead: number;
  behind: number;
}

export function useGitIntegration() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());

  const refreshStatus = async () => {
    const gitStatus = await mcpClient.call('speclang_git_status');
    setStatus(gitStatus);
  };

  const stageFile = (file: string) => {
    setStagedFiles(prev => new Set([...prev, file]));
  };

  const unstageFile = (file: string) => {
    setStagedFiles(prev => {
      const next = new Set(prev);
      next.delete(file);
      return next;
    });
  };

  const commit = async (message: string) => {
    const prefixedMessage = message.startsWith('speclang:') 
      ? message 
      : `speclang: ${message}`;
    
    await mcpClient.call('speclang_insert_command', {
      action: 'git_commit',
      files: Array.from(stagedFiles),
      message: prefixedMessage
    });
    
    setStagedFiles(new Set());
    refreshStatus();
    showToast('Committed successfully');
  };

  const getHistory = async (filter?: { speclangOnly?: boolean }) => {
    const commits = await mcpClient.call('speclang_git_log', filter);
    return commits;
  };

  const showDiff = async (commitSha: string) => {
    const diff = await mcpClient.call('speclang_git_diff', { sha: commitSha });
    return diff;
  };

  const revert = async (commitSha: string) => {
    if (confirm('Revert this commit?')) {
      await mcpClient.call('speclang_git_revert', { sha: commitSha });
      refreshStatus();
    }
  };

  const createBranch = async (name: string) => {
    await mcpClient.call('speclang_git_branch', { action: 'create', name });
    refreshStatus();
  };

  const switchBranch = async (name: string) => {
    if (status?.modified.length && !confirm('Uncommitted changes will be lost. Continue?')) {
      return;
    }
    await mcpClient.call('speclang_git_branch', { action: 'switch', name });
    refreshStatus();
  };

  const resolveConflict = async (file: string, resolution: 'ours' | 'theirs' | 'manual', content?: string) => {
    await mcpClient.call('speclang_git_resolve', { file, resolution, content });
    refreshStatus();
  };

  return {
    status,
    stagedFiles,
    refreshStatus,
    stageFile,
    unstageFile,
    commit,
    getHistory,
    showDiff,
    revert,
    createBranch,
    switchBranch,
    resolveConflict
  };
}
```

#### 5. Keyboard Shortcuts

```typescript
// handlers/keyboard-shortcuts.ts

export const SHORTCUTS = {
  'ctrl+s': 'save',
  'ctrl+shift+s': 'saveAll',
  'ctrl+n': 'newSpec',
  'ctrl+o': 'openSpec',
  'ctrl+/': 'toggleComment',
  'ctrl+space': 'autocomplete',
  'ctrl+enter': 'triggerCascade',
  'ctrl+shift+p': 'pauseCascade',
  'ctrl+shift+f': 'finalizeCascade',
  'escape': 'abortCascade',
  'f5': 'refreshDashboard',
  'ctrl+g': 'gitCommit',
  'ctrl+shift+h': 'gitHistory'
};

export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const combo = buildCombo(e);
      const action = SHORTCUTS[combo];
      if (action && handlers[action]) {
        e.preventDefault();
        handlers[action]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

function buildCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}
```

#### 6. Control Panel Component

```tsx
// components/ControlPanel.tsx

function CascadeControlPanel() {
  const { state, triggerCascade, pauseResume, stepMode, abortCascade, finalize } = useCascadeControl();

  return (
    <div className="control-panel brutalist-card">
      <h2>CASCADE CONTROL</h2>
      
      <div className="control-group">
        <button 
          className="brutalist-button"
          onClick={triggerCascade}
          disabled={state.status === 'running'}
        >
          TRIGGER
        </button>
        
        <button 
          className="brutalist-button"
          onClick={pauseResume}
          disabled={!state.canPause}
        >
          {state.status === 'paused' ? 'RESUME' : 'PAUSE'}
        </button>
        
        <button 
          className="brutalist-button"
          onClick={stepMode}
          disabled={state.status !== 'paused'}
        >
          STEP
        </button>
      </div>
      
      <div className="control-group danger">
        <button 
          className="brutalist-button"
          onClick={abortCascade}
          disabled={!state.canAbort}
        >
          ABORT
        </button>
        
        <button 
          className="brutalist-button finalize"
          onClick={finalize}
          disabled={!state.canFinalize}
        >
          FINALIZE
        </button>
      </div>
      
      <div className="status-indicator">
        STATUS: {state.status.toUpperCase()}
      </div>
    </div>
  );
}
```

#### 7. Spec Editor Component

```tsx
// components/SpecEditor.tsx

function SpecEditor() {
  const { 
    state, 
    createNewSpec, 
    addBlock, 
    autocompleteRef, 
    validateRef, 
    saveSpec 
  } = useSpecEditor();
  
  const [previewMode, setPreviewMode] = useState(false);

  useKeyboardShortcuts({
    save: saveSpec,
    newSpec: createNewSpec,
    autocomplete: () => triggerAutocomplete()
  });

  return (
    <div className="spec-editor brutalist-card">
      <div className="editor-toolbar">
        <button onClick={createNewSpec}>NEW SPEC</button>
        <button onClick={addBlock}>ADD BLOCK</button>
        <button onClick={() => setPreviewMode(!previewMode)}>
          {previewMode ? 'EDIT' : 'PREVIEW'}
        </button>
        <button onClick={saveSpec} disabled={!state.isDirty}>SAVE</button>
      </div>
      
      {state.validationErrors.length > 0 && (
        <div className="validation-errors">
          {state.validationErrors.map((err, i) => (
            <div key={i} className="error">{err.message}</div>
          ))}
        </div>
      )}
      
      <div className="editor-container">
        <div className="editor-pane">
          <MonacoEditor
            value={state.currentSpec?.content || ''}
            onChange={handleContentChange}
            onCompletionRequest={autocompleteRef}
            language="speclang"
          />
        </div>
        
        {previewMode && (
          <div className="preview-pane">
            <SpecPreview content={state.previewContent} />
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 8. Git Panel Component

```tsx
// components/GitPanel.tsx

function GitPanel() {
  const { 
    status, 
    stagedFiles, 
    stageFile, 
    unstageFile, 
    commit 
  } = useGitIntegration();
  
  const [commitMessage, setCommitMessage] = useState('');

  if (!status) return null;

  return (
    <div className="git-panel brutalist-card">
      <h2>GIT</h2>
      <div className="branch-info">
        {status.branch} ({status.ahead} ahead, {status.behind} behind)
      </div>
      
      <div className="file-list">
        <h3>CHANGES</h3>
        {status.modified.map(file => (
          <div key={file} className="file-item">
            <input
              type="checkbox"
              checked={stagedFiles.has(file)}
              onChange={() => stagedFiles.has(file) ? unstageFile(file) : stageFile(file)}
            />
            <span className="file-name">{file}</span>
            <span className="file-status modified">M</span>
          </div>
        ))}
      </div>
      
      <div className="commit-form">
        <input
          className="brutalist-input"
          placeholder="Commit message..."
          value={commitMessage}
          onChange={e => setCommitMessage(e.target.value)}
        />
        <button 
          className="brutalist-button"
          onClick={() => commit(commitMessage)}
          disabled={stagedFiles.size === 0 || !commitMessage}
        >
          COMMIT
        </button>
      </div>
    </div>
  );
}
```

## Test Cases
1. Trigger cascade via button and shortcut
2. Pause/resume cascade updates UI correctly
3. Step mode executes one step at a time
4. Abort shows confirmation and rolls back
5. Create new spec with dialog
6. Add block inserts at cursor
7. @ref autocomplete shows search results
8. Save validates before committing
9. Real-time updates refresh correct components
10. Offline queue syncs on reconnect
11. Git commit prefixes with "speclang:"
12. Branch switch warns on uncommitted

## Validation
```bash
# Run interaction tests
bun test tests/dashboard/interactions/

# Test keyboard shortcuts
bun test tests/dashboard/shortcuts/

# Test git integration
bun test tests/dashboard/git/

# E2E tests
bunx playwright test e2e/interactions.spec.ts
```

## Output Format
After completing, output:
1. Interactions implemented
2. Keyboard shortcuts working
3. Real-time update handling
4. Git integration functional
