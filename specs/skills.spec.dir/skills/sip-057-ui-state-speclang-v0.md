---
name: sip-057-ui-state-speclang-v0
title: "SIP 57: UI State Management"
version: 0.1.0
description: State management patterns and persistence for Speclang UI
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 57: UI State Management

**Status:** Draft  
**Version:** 0.1.0  
**Author:** Speclang Core Team

## README

This SIP defines state management patterns and persistence for Speclang UI.

### Quick Start

1. **Store:** Zustand for cascade, spec, and UI state
2. **Hooks:** useMCP, useSSE, useSpecValidation
3. **Services:** MCPClient, SpecParser, EventBus
4. **Persistence:** LocalStorage + SQLite sync

### Example

```typescript
const useCascadeStore = create<CascadeState>((set, get) => ({
  active: false,
  depth: 0,
  events: [],
  
  actions: {
    triggerCascade: async (file) => {
      await mcpClient.insertCommand({ action: 'trigger', target_file: file });
      set({ active: true });
    },
    pauseCascade: async () => {
      await mcpClient.insertCommand({ action: 'pause' });
      set({ active: false });
    }
  }
}));
```

### Key Concepts

- **Zustand:** Lightweight state management
- **MCP Integration:** Model Context Protocol client
- **SSE:** Server-Sent Events for real-time updates
- **Persistence:** LocalStorage with sync

### When to Read This

- **Building UI:** Understanding state architecture
- **Integration:** Connecting to backend
- **Persistence:** Saving user preferences

### Related SIPs

- SIP 36: UI
- SIP 50: MCP Tools
- SIP 43: MCP Daemon

## Abstract

This SIP defines the state management architecture for Speclang UI, including store patterns, MCP integration, real-time updates via SSE, and persistence strategies.

## Motivation

UI needs:
- Reactive state management
- Real-time updates from daemon
- Persistent user preferences
- Efficient re-renders
- Type safety

## Rationale

**Architecture:**

```
UI Components
     ↓
  Zustand Stores
     ↓
  Services (MCP, SSE, Parser)
     ↓
  Backend (speclangd)
```

**Benefits:**
- Minimal boilerplate
- Real-time updates
- Type-safe stores
- Easy testing
- Persistent state

## Specification

### Implementation Stack

**@ui/implementation-stack:**

```yaml
Project structure:
  ui/:
    src/:
      components/:
        - dashboard/
        - editor/
        - cascade/
        - agents/
        - shared/
      hooks/:
        - useMCP.ts
        - useSSE.ts
        - useSpecValidation.ts
      stores/:
        - cascadeStore.ts
        - specStore.ts
        - uiStore.ts
      services/:
        - mcpClient.ts
        - specParser.ts
        - eventBus.ts
      types/:
        - speclang.ts
    public/:
    package.json
```

### MCP Integration

**@ui/implementation-mcp-integration:**

```typescript
class MCPClient {
  private baseURL: string;
  private sse: EventSource | null = null;

  constructor(mode: 'local' | 'remote' = 'local') {
    this.baseURL = mode === 'local' 
      ? 'http://localhost:3000' 
      : 'http://speclang-server:3000';
  }

  async search(query: string, filters?: SearchFilters) {
    const response = await fetch(`${this.baseURL}/tools/speclang_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...filters })
    });
    return response.json();
  }

  async getSpec(id: string) {
    const response = await fetch(`${this.baseURL}/tools/speclang_get_spec`, {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    return response.json();
  }

  connectSSE() {
    this.sse = new EventSource(`${this.baseURL}/events`);
    this.sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      eventBus.emit(data.type, data.payload);
    };
  }
}
```

### Editor Integration

**@ui/implementation-editor-integration:**

```typescript
// Monaco editor configuration
import * as monaco from 'monaco-editor';

// Register Speclang language
monaco.languages.register({ id: 'speclang' });
monaco.languages.setMonarchTokensProvider('speclang', speclangLanguageDefinition);

// Register completion provider
monaco.languages.registerCompletionItemProvider('speclang', {
  provideCompletionItems: async (model, position) => {
    const word = model.getWordUntilPosition(position);
    const suggestions = await mcpClient.getCompletionSuggestions(word.word);
    
    return {
      suggestions: suggestions.map(s => ({
        label: s.label,
        kind: monaco.languages.CompletionItemKind[s.kind],
        insertText: s.insertText,
        documentation: s.documentation
      }))
    };
  }
});

// Create editor instance
const editor = monaco.editor.create(document.getElementById('editor'), {
  language: 'speclang',
  theme: 'speclang-dark',
  minimap: { enabled: true },
  wordWrap: 'on',
  fontSize: 14,
  lineNumbers: 'on',
  automaticLayout: true
});
```

### State Management

**@ui/implementation-state-management:**

```typescript
import { create } from 'zustand';

interface CascadeState {
  active: boolean;
  depth: number;
  events: CascadeEvent[];
  agents: AgentStatus[];
  
  actions: {
    triggerCascade: (file?: string) => Promise<void>;
    pauseCascade: () => Promise<void>;
    finalizeCascade: () => Promise<void>;
    addEvent: (event: CascadeEvent) => void;
    updateAgent: (agentId: string, status: Partial<AgentStatus>) => void;
  };
}

const useCascadeStore = create<CascadeState>((set, get) => ({
  active: false,
  depth: 0,
  events: [],
  agents: [],
  
  actions: {
    triggerCascade: async (file) => {
      await mcpClient.insertCommand({
        action: 'trigger',
        target_file: file
      });
      set({ active: true });
    },
    
    pauseCascade: async () => {
      await mcpClient.insertCommand({ action: 'pause' });
      set({ active: false });
    },
    
    finalizeCascade: async () => {
      await mcpClient.insertCommand({ action: 'finalize' });
      set({ active: false });
    },
    
    addEvent: (event) => {
      set(state => ({ 
        events: [...state.events, event].slice(-1000),
        depth: Math.max(state.depth, event.depth)
      }));
    },
    
    updateAgent: (agentId, status) => {
      set(state => ({
        agents: state.agents.map(agent => 
          agent.id === agentId ? { ...agent, ...status } : agent
        )
      }));
    }
  }
}));
```

### Store Architecture

**Stores:**

```typescript
// Cascade Store - tracks cascade state
interface CascadeStore {
  active: boolean;
  depth: number;
  maxDepth: number;
  events: CascadeEvent[];
  startTime: Date | null;
}

// Spec Store - tracks spec tree
interface SpecStore {
  specs: Spec[];
  selectedSpec: Spec | null;
  searchQuery: string;
  filters: SearchFilters;
}

// UI Store - tracks UI state
interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeTab: string;
  editorSettings: EditorSettings;
}
```

### Custom Hooks

```typescript
// useMCP - MCP connection hook
function useMCP() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const client = new MCPClient();
    client.connect()
      .then(() => setConnected(true))
      .catch(setError);
      
    return () => client.disconnect();
  }, []);
  
  return { connected, error, client: mcpClient };
}

// useSSE - Server-Sent Events hook
function useSSE(eventType: string, handler: (data: any) => void) {
  useEffect(() => {
    const unsubscribe = eventBus.on(eventType, handler);
    return unsubscribe;
  }, [eventType, handler]);
}

// useSpecValidation - spec validation hook
function useSpecValidation(spec: Spec) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  useEffect(() => {
    setIsValidating(true);
    validateSpec(spec)
      .then(setErrors)
      .finally(() => setIsValidating(false));
  }, [spec]);
  
  return { errors, isValidating, isValid: errors.length === 0 };
}
```

### Event Bus

```typescript
type EventHandler = (payload: any) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    
    return () => this.off(event, handler);
  }
  
  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }
  
  emit(event: string, payload: any): void {
    this.listeners.get(event)?.forEach(handler => handler(payload));
  }
}

export const eventBus = new EventBus();
```

### Persistence

**LocalStorage Strategy:**

```typescript
// Persist store to localStorage
const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'speclang-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
```

**SQLite Sync:**

```typescript
class StateSync {
  private db: SQLite.DB;
  
  async syncToDB(store: string, state: any): Promise<void> {
    await this.db.run(
      'INSERT OR REPLACE INTO ui_state (store, state, updated) VALUES (?, ?, ?)',
      [store, JSON.stringify(state), Date.now()]
    );
  }
  
  async loadFromDB(store: string): Promise<any> {
    const row = await this.db.get(
      'SELECT state FROM ui_state WHERE store = ?',
      [store]
    );
    return row ? JSON.parse(row.state) : null;
  }
}
```

## Configuration

**UI Settings:**

```yaml
ui:
  theme: dark
  editor:
    fontSize: 14
    wordWrap: true
    minimap: true
  sidebar:
    defaultOpen: true
    width: 300
  cascade:
    maxEvents: 1000
    updateInterval: 100
  persistence:
    enabled: true
    syncInterval: 5000
```

## Implementation

### Store Provider

```typescript
function StoreProvider({ children }: { children: React.ReactNode }) {
  // Initialize MCP client
  const mcpClient = useMemo(() => new MCPClient(), []);
  
  // Connect SSE on mount
  useEffect(() => {
    mcpClient.connectSSE();
    return () => mcpClient.disconnect();
  }, [mcpClient]);
  
  // Subscribe to cascade events
  useSSE('cascade.event', (event) => {
    useCascadeStore.getState().addEvent(event);
  });
  
  useSSE('cascade.depth', (depth) => {
    useCascadeStore.setState({ depth });
  });
  
  return children;
}
```

### React Components

```typescript
function CascadeMonitor() {
  const { active, depth, events } = useCascadeStore();
  
  return (
    <div className="cascade-monitor">
      <StatusIndicator active={active} />
      <DepthDisplay depth={depth} />
      <EventList events={events.slice(-10)} />
    </div>
  );
}

function SpecTree() {
  const { specs, selectedSpec } = useSpecStore();
  const { selectSpec } = useSpecStore.getState();
  
  return (
    <Tree>
      {specs.map(spec => (
        <TreeNode
          key={spec.id}
          selected={spec === selectedSpec}
          onClick={() => selectSpec(spec)}
        >
          {spec.title}
        </TreeNode>
      ))}
    </Tree>
  );
}
```

## Debugging

**DevTools:**

```typescript
// Enable Zustand devtools
const useCascadeStore = create<CascadeState>()(
  devtools(
    (set, get) => ({
      // ... store implementation
    }),
    { name: 'CascadeStore' }
  )
);

// Log state changes
if (process.env.NODE_ENV === 'development') {
  useCascadeStore.subscribe(
    (state) => console.log('Cascade state:', state)
  );
}
```

## References

- SIP 36: UI
- SIP 50: MCP Tools
- SIP 43: MCP Daemon
- SIP 35: Lenses

## Copyright

This document is in the public domain.
