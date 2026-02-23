# speclang-header lines:14
id: "@speclang/ui.state-management"
parent: "@ref:specs/ui"
part: 12/14
siblings:
  prev: "@ref:specs/ui.spec.dir/interactions"
  next: "@ref:specs/ui.spec.dir/testing"
short: State management and implementation notes
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 0
---

## Implementation Notes

### @ui/implementation-stack

```speclang
# @block:ui/implementation-stack @kind:code
```typescript
// Project structure
ui/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── editor/
│   │   ├── cascade/
│   │   ├── agents/
│   │   └── shared/
│   ├── hooks/
│   │   ├── useMCP.ts
│   │   ├── useSSE.ts
│   │   └── useSpecValidation.ts
│   ├── stores/
│   │   ├── cascadeStore.ts
│   │   ├── specStore.ts
│   │   └── uiStore.ts
│   ├── services/
│   │   ├── mcpClient.ts
│   │   ├── specParser.ts
│   │   └── eventBus.ts
│   └── types/
│       └── speclang.ts
├── public/
└── package.json
```
```

### @ui/implementation-mcp-integration

```speclang
# @block:ui/implementation-mcp-integration @kind:code
```typescript
// MCP client service
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
```

### @ui/implementation-editor-integration

```speclang
# @block:ui/implementation-editor-integration @kind:code
```typescript
// Monaco editor configuration
import * as monaco from 'monaco-editor';
import { speclangLanguageDefinition } from './languages/speclang';

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
```

### @ui/implementation-state-management

```speclang
# @block:ui/implementation-state-management @kind:code
```typescript
// Zustand store for cascade state
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
```
