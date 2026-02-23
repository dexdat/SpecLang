# Bootstrap Phase 6.3: UI State Management

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 6.3 of the bootstrap process.

**Prerequisites**: 
- Phase 0-5 (Core system) complete
- Phase 6.1-6.2 (UI Dashboard, Components) in progress
- Understanding of MCP integration

## Your Task
Implement the UI state management system using Zustand stores with persistence, SSE integration for real-time updates, and state synchronization.

## Read These Specs First
1. `specs/ui.spec.dir/state-management.spec.md` - State management specs
2. `specs/ui.spec.dir/overview.spec.md` - UI overview
3. `specs/mcp-server.spec.dir/sse.spec.md` - SSE events

## What to Build

### Files to Create
```
ui/src/
├── stores/
│   ├── index.ts           # Main exports
│   ├── cascadeStore.ts    # Cascade state
│   ├── specStore.ts       # Spec management
│   ├── agentStore.ts      # Agent sessions
│   ├── uiStore.ts         # UI preferences
│   └── types.ts           # Store types
│
├── hooks/
│   ├── useMCP.ts          # MCP client hook
│   ├── useSSE.ts          # SSE connection hook
│   ├── usePersistence.ts  # Local storage hook
│   └── useSync.ts         # State sync hook
│
├── services/
│   ├── mcpClient.ts       # MCP client service
│   ├── eventBus.ts        # Event bus for SSE
│   └── storage.ts         # Persistence service
│
tests/
└── ui-stores.test.ts
```

### Requirements

#### 1. Store Types

```typescript
// ui/src/stores/types.ts

interface CascadeEvent {
  cascade_id: string;
  depth: number;
  trigger: {
    file: string;
    kind: 'create' | 'modify' | 'delete';
  };
  agent: string;
  output: string[];
  timestamp: string;
}

interface AgentStatus {
  id: string;
  role: AgentRole;
  status: 'idle' | 'active' | 'done' | 'error';
  currentFile?: string;
  lastActivity: string;
}

interface SpecInfo {
  id: string;
  path: string;
  layer: number;
  tags: string[];
  refs: string[];
  lastModified: string;
}

interface UIPreferences {
  theme: 'light' | 'dark';
  editorFontSize: number;
  showMinimap: boolean;
  autoSave: boolean;
  cascadeView: 'tree' | 'flow' | 'list';
}
```

#### 2. Cascade Store

```typescript
// ui/src/stores/cascadeStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CascadeState {
  active: boolean;
  cascadeId: string | null;
  depth: number;
  maxDepth: number;
  events: CascadeEvent[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  
  actions: {
    triggerCascade: (file?: string) => Promise<void>;
    pauseCascade: () => Promise<void>;
    resumeCascade: () => Promise<void>;
    finalizeCascade: () => Promise<void>;
    addEvent: (event: CascadeEvent) => void;
    updateStatus: (status: CascadeState['status']) => void;
    reset: () => void;
  };
}

const initialState = {
  active: false,
  cascadeId: null,
  depth: 0,
  maxDepth: 100,
  events: [],
  status: 'idle' as const
};

export const useCascadeStore = create<CascadeState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      actions: {
        triggerCascade: async (file) => {
          const mcpClient = getMCPClient();
          const result = await mcpClient.insertCommand({
            action: 'trigger',
            target_file: file
          });
          
          set({
            active: true,
            cascadeId: result.cascade_id,
            status: 'running',
            depth: 0,
            events: []
          });
        },
        
        pauseCascade: async () => {
          const mcpClient = getMCPClient();
          await mcpClient.insertCommand({ action: 'pause' });
          set({ status: 'paused' });
        },
        
        resumeCascade: async () => {
          const mcpClient = getMCPClient();
          await mcpClient.insertCommand({ action: 'resume' });
          set({ status: 'running' });
        },
        
        finalizeCascade: async () => {
          const mcpClient = getMCPClient();
          await mcpClient.insertCommand({ action: 'finalize' });
          set({ active: false, status: 'completed' });
        },
        
        addEvent: (event) => {
          set(state => ({
            events: [...state.events, event].slice(-1000),
            depth: Math.max(state.depth, event.depth)
          }));
        },
        
        updateStatus: (status) => {
          set({ status, active: status === 'running' });
        },
        
        reset: () => {
          set(initialState);
        }
      }
    }),
    {
      name: 'speclang-cascade',
      partialize: (state) => ({
        cascadeId: state.cascadeId,
        events: state.events.slice(-100),
        status: state.status
      })
    }
  )
);
```

#### 3. Spec Store

```typescript
// ui/src/stores/specStore.ts

import { create } from 'zustand';

interface SpecState {
  specs: Map<string, SpecInfo>;
  currentIndex: string | null;
  searchResults: SpecInfo[];
  loading: boolean;
  
  actions: {
    loadSpec: (id: string) => Promise<string>;
    searchSpecs: (query: string, filters?: SearchFilters) => Promise<void>;
    updateSpec: (id: string, content: string) => Promise<void>;
    setIndex: (indexId: string) => void;
    refreshIndex: () => Promise<void>;
  };
}

interface SearchFilters {
  tags?: string[];
  layer?: number;
  path?: string;
}

export const useSpecStore = create<SpecState>((set, get) => ({
  specs: new Map(),
  currentIndex: null,
  searchResults: [],
  loading: false,
  
  actions: {
    loadSpec: async (id) => {
      set({ loading: true });
      
      const mcpClient = getMCPClient();
      const result = await mcpClient.getSpec(id);
      
      // Update spec info in map
      set(state => {
        const specs = new Map(state.specs);
        specs.set(id, {
          id,
          path: result.path,
          layer: result.layer,
          tags: result.tags,
          refs: result.refs,
          lastModified: new Date().toISOString()
        });
        return { specs, loading: false };
      });
      
      return result.content;
    },
    
    searchSpecs: async (query, filters) => {
      set({ loading: true });
      
      const mcpClient = getMCPClient();
      const results = await mcpClient.search(query, filters);
      
      set({
        searchResults: results.map((r: any) => ({
          id: r.id,
          path: r.path,
          layer: r.layer,
          tags: r.tags,
          refs: r.refs || [],
          lastModified: r.lastModified
        })),
        loading: false
      });
    },
    
    updateSpec: async (id, content) => {
      const mcpClient = getMCPClient();
      await mcpClient.writeSpec(id, content);
      
      // Update lastModified
      set(state => {
        const specs = new Map(state.specs);
        const spec = specs.get(id);
        if (spec) {
          specs.set(id, {
            ...spec,
            lastModified: new Date().toISOString()
          });
        }
        return { specs };
      });
    },
    
    setIndex: (indexId) => {
      set({ currentIndex: indexId });
    },
    
    refreshIndex: async () => {
      const mcpClient = getMCPClient();
      await mcpClient.rebuildIndex();
    }
  }
}));
```

#### 4. Agent Store

```typescript
// ui/src/stores/agentStore.ts

import { create } from 'zustand';

interface AgentState {
  agents: AgentStatus[];
  sessions: Map<string, any>;
  
  actions: {
    updateAgent: (agentId: string, status: Partial<AgentStatus>) => void;
    addSession: (sessionId: string, data: any) => void;
    removeSession: (sessionId: string) => void;
    refreshAgents: () => Promise<void>;
  };
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  sessions: new Map(),
  
  actions: {
    updateAgent: (agentId, status) => {
      set(state => ({
        agents: state.agents.map(agent =>
          agent.id === agentId ? { ...agent, ...status } : agent
        )
      }));
    },
    
    addSession: (sessionId, data) => {
      set(state => {
        const sessions = new Map(state.sessions);
        sessions.set(sessionId, data);
        return { sessions };
      });
    },
    
    removeSession: (sessionId) => {
      set(state => {
        const sessions = new Map(state.sessions);
        sessions.delete(sessionId);
        return { sessions };
      });
    },
    
    refreshAgents: async () => {
      const mcpClient = getMCPClient();
      const result = await mcpClient.getAgentStatus();
      
      set({
        agents: result.agents.map((a: any) => ({
          id: a.id,
          role: a.role,
          status: a.status,
          currentFile: a.current_file,
          lastActivity: a.last_activity
        }))
      });
    }
  }
}));
```

#### 5. UI Store

```typescript
// ui/src/stores/uiStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  preferences: UIPreferences;
  sidebarOpen: boolean;
  activeTab: string;
  notifications: Notification[];
  
  actions: {
    setTheme: (theme: 'light' | 'dark') => void;
    setEditorFontSize: (size: number) => void;
    toggleMinimap: () => void;
    toggleSidebar: () => void;
    setActiveTab: (tab: string) => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    setCascadeView: (view: UIPreferences['cascadeView']) => void;
  };
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

const defaultPreferences: UIPreferences = {
  theme: 'dark',
  editorFontSize: 14,
  showMinimap: true,
  autoSave: true,
  cascadeView: 'tree'
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      sidebarOpen: true,
      activeTab: 'specs',
      notifications: [],
      
      actions: {
        setTheme: (theme) => {
          set(state => ({
            preferences: { ...state.preferences, theme }
          }));
          document.documentElement.setAttribute('data-theme', theme);
        },
        
        setEditorFontSize: (size) => {
          set(state => ({
            preferences: { ...state.preferences, editorFontSize: size }
          }));
        },
        
        toggleMinimap: () => {
          set(state => ({
            preferences: {
              ...state.preferences,
              showMinimap: !state.preferences.showMinimap
            }
          }));
        },
        
        toggleSidebar: () => {
          set(state => ({ sidebarOpen: !state.sidebarOpen }));
        },
        
        setActiveTab: (tab) => {
          set({ activeTab: tab });
        },
        
        addNotification: (notification) => {
          const id = `notification-${Date.now()}`;
          set(state => ({
            notifications: [
              ...state.notifications,
              { ...notification, id, timestamp: new Date().toISOString() }
            ]
          }));
          
          // Auto-remove after 5 seconds
          setTimeout(() => {
            get().actions.removeNotification(id);
          }, 5000);
        },
        
        removeNotification: (id) => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        },
        
        setCascadeView: (view) => {
          set(state => ({
            preferences: { ...state.preferences, cascadeView: view }
          }));
        }
      }
    }),
    {
      name: 'speclang-ui',
      partialize: (state) => ({
        preferences: state.preferences,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
);
```

#### 6. MCP Client Service

```typescript
// ui/src/services/mcpClient.ts

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    return response.json();
  }
  
  async writeSpec(id: string, content: string) {
    const response = await fetch(`${this.baseURL}/tools/speclang_write_spec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content })
    });
    return response.json();
  }
  
  async insertCommand(command: any) {
    const response = await fetch(`${this.baseURL}/tools/speclang_insert_command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });
    return response.json();
  }
  
  async getAgentStatus() {
    const response = await fetch(`${this.baseURL}/tools/speclang_get_agents`, {
      method: 'POST'
    });
    return response.json();
  }
  
  async rebuildIndex() {
    const response = await fetch(`${this.baseURL}/tools/speclang_rebuild_index`, {
      method: 'POST'
    });
    return response.json();
  }
  
  connectSSE() {
    this.sse = new EventSource(`${this.baseURL}/events`);
    
    this.sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      eventBus.emit(data.type, data.payload);
    };
    
    this.sse.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventBus.emit('connection_error', { error });
    };
  }
  
  disconnectSSE() {
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
  }
}

export const mcpClient = new MCPClient();
export const getMCPClient = () => mcpClient;
```

#### 7. Event Bus

```typescript
// ui/src/services/eventBus.ts

type EventHandler = (payload: any) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler>>;
  
  constructor() {
    this.handlers = new Map();
  }
  
  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }
  
  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  
  emit(event: string, payload: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }
  }
  
  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
```

#### 8. SSE Hook

```typescript
// ui/src/hooks/useSSE.ts

import { useEffect } from 'react';
import { useCascadeStore } from '../stores/cascadeStore';
import { useAgentStore } from '../stores/agentStore';
import { useUIStore } from '../stores/uiStore';
import { eventBus } from '../services/eventBus';
import { getMCPClient } from '../services/mcpClient';

export function useSSE() {
  const cascadeActions = useCascadeStore(state => state.actions);
  const agentActions = useAgentStore(state => state.actions);
  const uiActions = useUIStore(state => state.actions);
  
  useEffect(() => {
    const mcpClient = getMCPClient();
    mcpClient.connectSSE();
    
    // Subscribe to events
    const unsubscribers = [
      eventBus.on('cascade_event', (payload) => {
        cascadeActions.addEvent(payload);
      }),
      
      eventBus.on('cascade_status', (payload) => {
        cascadeActions.updateStatus(payload.status);
      }),
      
      eventBus.on('agent_update', (payload) => {
        agentActions.updateAgent(payload.agentId, payload.status);
      }),
      
      eventBus.on('notification', (payload) => {
        uiActions.addNotification({
          type: payload.type,
          message: payload.message
        });
      }),
      
      eventBus.on('connection_error', () => {
        uiActions.addNotification({
          type: 'error',
          message: 'Lost connection to server'
        });
      })
    ];
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
      mcpClient.disconnectSSE();
    };
  }, []);
}
```

#### 9. Sync Hook

```typescript
// ui/src/hooks/useSync.ts

import { useEffect } from 'react';
import { useCascadeStore } from '../stores/cascadeStore';
import { useAgentStore } from '../stores/agentStore';
import { getMCPClient } from '../services/mcpClient';

export function useSync(intervalMs: number = 5000) {
  const cascadeActions = useCascadeStore(state => state.actions);
  const agentActions = useAgentStore(state => state.actions);
  const cascadeId = useCascadeStore(state => state.cascadeId);
  
  useEffect(() => {
    const sync = async () => {
      const mcpClient = getMCPClient();
      
      // Sync agent status
      await agentActions.refreshAgents();
      
      // Sync cascade state if active
      if (cascadeId) {
        const state = await mcpClient.getCascadeState(cascadeId);
        if (state) {
          cascadeActions.updateStatus(state.status);
        }
      }
    };
    
    // Initial sync
    sync();
    
    // Periodic sync
    const interval = setInterval(sync, intervalMs);
    
    return () => clearInterval(interval);
  }, [intervalMs, cascadeId]);
}
```

## Test Cases
1. Stores initialize with default state
2. Cascade actions update state correctly
3. Spec search returns results
4. Agent status updates propagate
5. UI preferences persist across reloads
6. SSE events update stores
7. Sync hook refreshes data
8. Notifications auto-dismiss

## Validation
```bash
cd ui && npm test -- stores
```

## Output Format
After completing, output:
1. Files created
2. Test results
3. Store architecture diagram
