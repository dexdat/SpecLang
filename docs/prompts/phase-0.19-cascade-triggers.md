# Bootstrap Phase 0.19: Cascade Triggers

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 0.19 of the bootstrap process.

**Prerequisites**: 
- Phase 0.1-0.18 (Foundation) complete
- Understanding of file watching and daemon architecture

## Your Task
Implement cascade triggers - the reactive loop where file changes trigger agent reactions. This is the heart of the SpecLang system.

## Read These Specs First
1. `specs/cascade.spec.dir/triggers.spec.md` - Trigger definitions
2. `specs/cascade-protocol.spec.md` - Cascade coordination
3. `specs/core.spec.dir/agents.spec.md` - Agent definitions

## What to Build

### Files to Create
```
src/cascade/
├── triggers/
│   ├── index.ts           # Main exports
│   ├── types.ts           # Trigger types
│   ├── sources.ts         # Trigger sources
│   ├── router.ts          # Trigger routing
│   ├── handlers.ts        # Trigger handlers
│   └── watcher.ts         # File watcher integration

tests/
└── cascade-triggers.test.ts
```

### Requirements

#### 1. Trigger Types

```typescript
// src/cascade/triggers/types.ts

type TriggerSource = 
  | 'user_edit'     // Human or orchestrator edits
  | 'agent_write'   // Agent writes its owned file
  | 'external';     // Git pull, file sync

type TriggerPriority = 'high' | 'normal' | 'low';

interface Trigger {
  id: string;
  source: TriggerSource;
  file: string;
  kind: 'create' | 'modify' | 'delete';
  timestamp: Date;
  priority: TriggerPriority;
  cascade_id?: string;
}

interface TriggerSourceConfig {
  source: TriggerSource;
  files: string[];           // File patterns
  priority: TriggerPriority;
  starts_cascade?: boolean;
  triggers?: string[];       // Agent types to trigger
}
```

#### 2. Trigger Sources Configuration

```typescript
// src/cascade/triggers/sources.ts

const TRIGGER_SOURCES: TriggerSourceConfig[] = [
  {
    source: 'user_edit',
    files: ['project.scl', 'specs/core/**'],
    priority: 'high',
    starts_cascade: true
  },
  {
    source: 'spec-writer',
    files: ['specs/**/*.scl', 'specs/**/*.spec.*'],
    priority: 'normal',
    triggers: ['code-gen', 'test-writer']
  },
  {
    source: 'code-gen',
    files: ['generated/**/*'],
    priority: 'normal',
    triggers: ['test-runner']
  },
  {
    source: 'external',
    files: ['**/*'],
    priority: 'low',
    triggers: [] // Determined dynamically
  }
];

export function identifyTriggerSource(
  filePath: string
): TriggerSourceConfig | null {
  for (const config of TRIGGER_SOURCES) {
    for (const pattern of config.files) {
      if (matchPattern(filePath, pattern)) {
        return config;
      }
    }
  }
  return null;
}
```

#### 3. Trigger Router

```typescript
// src/cascade/triggers/router.ts

interface RoutingResult {
  agents: string[];
  priority: TriggerPriority;
  starts_cascade: boolean;
}

export class TriggerRouter {
  private agentRegistry: AgentRegistry;
  
  constructor(agentRegistry: AgentRegistry) {
    this.agentRegistry = agentRegistry;
  }
  
  route(trigger: Trigger): RoutingResult {
    const sourceConfig = identifyTriggerSource(trigger.file);
    
    if (!sourceConfig) {
      return { agents: [], priority: 'low', starts_cascade: false };
    }
    
    // Determine target agents
    const agents = this.determineAgents(trigger, sourceConfig);
    
    return {
      agents,
      priority: sourceConfig.priority,
      starts_cascade: sourceConfig.starts_cascade || false
    };
  }
  
  private determineAgents(
    trigger: Trigger, 
    config: TriggerSourceConfig
  ): string[] {
    if (config.triggers) {
      return config.triggers;
    }
    
    // Dynamic routing based on file type
    if (trigger.file.endsWith('.scl') || trigger.file.includes('.spec.')) {
      return ['speclang-spec-writer', 'speclang-code-gen'];
    }
    
    if (trigger.file.startsWith('generated/')) {
      return ['speclang-test-writer'];
    }
    
    return [];
  }
}
```

#### 4. Trigger Handlers

```typescript
// src/cascade/triggers/handlers.ts

export interface TriggerHandler {
  canHandle(trigger: Trigger): boolean;
  handle(trigger: Trigger): Promise<HandlerResult>;
}

interface HandlerResult {
  handled: boolean;
  cascadeStarted?: string;
  agentsInvoked?: string[];
  error?: string;
}

export class UserEditHandler implements TriggerHandler {
  canHandle(trigger: Trigger): boolean {
    return trigger.source === 'user_edit';
  }
  
  async handle(trigger: Trigger): Promise<HandlerResult> {
    // User edits always start a cascade
    const cascadeId = await this.startCascade(trigger);
    
    return {
      handled: true,
      cascadeStarted: cascadeId,
      agentsInvoked: ['speclang-spec-writer']
    };
  }
  
  private async startCascade(trigger: Trigger): Promise<string> {
    // Initialize cascade state
    const cascadeId = `cascade-${Date.now().toString(36)}`;
    // ... cascade initialization
    return cascadeId;
  }
}

export class AgentWriteHandler implements TriggerHandler {
  canHandle(trigger: Trigger): boolean {
    return trigger.source === 'agent_write';
  }
  
  async handle(trigger: Trigger): Promise<HandlerResult> {
    // Route to downstream agents
    const router = new TriggerRouter(this.registry);
    const routing = router.route(trigger);
    
    if (routing.agents.length === 0) {
      return { handled: false };
    }
    
    // Invoke agents
    for (const agent of routing.agents) {
      await this.invokeAgent(agent, trigger);
    }
    
    return {
      handled: true,
      agentsInvoked: routing.agents
    };
  }
}

export class ExternalHandler implements TriggerHandler {
  canHandle(trigger: Trigger): boolean {
    return trigger.source === 'external';
  }
  
  async handle(trigger: Trigger): Promise<HandlerResult> {
    // Check if this is a spec-related change
    if (!this.isSpecRelated(trigger.file)) {
      return { handled: false };
    }
    
    // Treat as user edit
    const userHandler = new UserEditHandler();
    return userHandler.handle(trigger);
  }
  
  private isSpecRelated(filePath: string): boolean {
    return filePath.startsWith('specs/') || 
           filePath === 'project.scl';
  }
}
```

#### 5. File Watcher Integration

```typescript
// src/cascade/triggers/watcher.ts

export interface WatchConfig {
  watch_patterns: string[];
  ignore_patterns: string[];
  debounce_ms: number;
}

const DEFAULT_CONFIG: WatchConfig = {
  watch_patterns: [
    '**/*.spec.{md,yaml,yml,scl}',
    '**/*.{go,ts,js,py,rs,java}.spec',
    '**/project.scl',
    '**/build.{scl,yaml}'
  ],
  ignore_patterns: [
    '*.log',
    'reports/**/*',
    '.speclang/**/*',
    'node_modules/**/*',
    '.git/**/*'
  ],
  debounce_ms: 100
};

export class TriggerWatcher {
  private config: WatchConfig;
  private handlers: TriggerHandler[];
  private pending: Map<string, NodeJS.Timeout>;
  
  constructor(
    config: Partial<WatchConfig> = {},
    handlers: TriggerHandler[]
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.handlers = handlers;
    this.pending = new Map();
  }
  
  onFileChange(event: FileEvent): void {
    const filePath = event.path;
    
    // Check ignore patterns
    if (this.shouldIgnore(filePath)) {
      return;
    }
    
    // Check watch patterns
    if (!this.shouldWatch(filePath)) {
      return;
    }
    
    // Debounce
    this.debounce(filePath, () => {
      this.processTrigger({
        id: `trigger-${Date.now()}`,
        source: this.identifySource(filePath),
        file: filePath,
        kind: event.kind,
        timestamp: new Date(),
        priority: 'normal'
      });
    });
  }
  
  private shouldIgnore(filePath: string): boolean {
    return this.config.ignore_patterns.some(
      pattern => matchPattern(filePath, pattern)
    );
  }
  
  private shouldWatch(filePath: string): boolean {
    return this.config.watch_patterns.some(
      pattern => matchPattern(filePath, pattern)
    );
  }
  
  private debounce(filePath: string, fn: () => void): void {
    if (this.pending.has(filePath)) {
      clearTimeout(this.pending.get(filePath)!);
    }
    
    this.pending.set(
      filePath,
      setTimeout(() => {
        this.pending.delete(filePath);
        fn();
      }, this.config.debounce_ms)
    );
  }
  
  private async processTrigger(trigger: Trigger): Promise<void> {
    for (const handler of this.handlers) {
      if (handler.canHandle(trigger)) {
        await handler.handle(trigger);
        break;
      }
    }
  }
}
```

#### 6. Trigger Flow Example

```yaml
trigger_flow:
  depth_0:
    trigger: user edits project.scl
    source: user_edit
    result: starts cascade
  
  depth_1:
    trigger: spec-writer creates auth.scl
    source: agent_write
    agent: speclang-spec-writer
    result: triggers code-gen
  
  depth_2:
    trigger: code-gen creates generated/auth.go
    source: agent_write
    agent: speclang-code-gen
    result: triggers test-writer
  
  depth_3:
    trigger: test-writer creates auth_test.go
    source: agent_write
    agent: speclang-test-writer
    result: triggers test-runner
  
  convergence:
    quiet_period: 30s
    result: cascade ends
```

## Test Cases
1. Identify trigger source correctly
2. Route user edits to start cascade
3. Route agent writes to downstream agents
4. Handle external triggers (git pull)
5. Ignore patterns work correctly
6. Debouncing prevents rapid triggers
7. Priority ordering works
8. Trigger events logged correctly

## Validation
```bash
bun test tests/cascade-triggers.test.ts
```

## Output Format
After completing, output:
1. Files created
2. Test results
3. Trigger routing summary
