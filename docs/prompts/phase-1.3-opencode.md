# Bootstrap Phase 1.3: OpenCode Integration

## Context
You are building SpecLang - a reactive multi-agent system where specs self-assemble into code. This is Phase 1.3 of the bootstrap process.

**Prerequisites**: 
- Phase 0 (Foundation) complete
- Phase 1.1 (Daemon) in progress
- Phase 1.2 (Agents) in progress

## Your Task
Implement the OpenCode plugin that integrates SpecLang's reactive cascade with the OpenCode editor/runtime environment. This plugin provides file watching, event routing, and skill execution.

## Read These Specs First
1. `specs/opencode.spec.md` - OpenCode integration overview
2. `specs/opencode-plugin.spec.md` - Plugin spec index
3. `specs/opencode-plugin.spec.dir/overview.spec.md` - Plugin overview
4. `specs/opencode-plugin.spec.dir/event-system.spec.md` - Event handlers
5. `specs/opencode-plugin.spec.dir/architecture.spec.md` - Architecture

## Current State
- OpenCode provides HTTP server with SSE
- Native plugin system exists
- File watcher available
- Skills system ready

## What to Build

### Files to Create
```
~/.opencode/plugins/
└── speclang.ts           # Main plugin entry point

src/opencode/
├── plugin.ts             # Plugin class
├── events.ts             # Event handlers
├── skills.ts             # Skill loaders
├── tools.ts              # MCP tools integration
├── git.ts                # Git integration
└── convergence.ts        # Convergence detection

.opencode/skills/
├── spec-writer.md        # Spec expansion skill
├── code-gen.md           # Code generation skill
├── test-writer.md        # Test writing skill
└── back-sync.md          # Code-to-spec sync skill
```

### Requirements

#### 1. Plugin Entry Point (~/.opencode/plugins/speclang.ts)
```typescript
import { Plugin } from 'opencode';
import { SpeclangPlugin } from './speclang/plugin';

export default {
  name: 'speclang',
  version: '0.1.0',
  
  async activate(context: PluginContext) {
    const plugin = new SpeclangPlugin(context);
    await plugin.initialize();
    
    // Register event handlers
    context.events.on('file.edited', plugin.onFileEdited);
    context.events.on('agent.finished', plugin.onAgentFinished);
    context.events.on('session.idle', plugin.onSessionIdle);
    
    // Register tools
    context.tools.register('speclang_search', plugin.search);
    context.tools.register('speclang_get_spec', plugin.getSpec);
    
    // Register skills
    context.skills.load('spec-writer');
    context.skills.load('code-gen');
    context.skills.load('test-writer');
    context.skills.load('back-sync');
  },
  
  async deactivate() {
    // Cleanup
  }
};
```

#### 2. Event System (events.ts)
```typescript
// File edited handler
events.on("file.edited", async (file: { path: string, content: string }) => {
  if (!isSpecFile(file.path)) return;
  
  const session = getCurrentSession();
  if (!await ownsFile(session, file.path)) {
    console.warn(`Session ${session} does not own ${file.path}`);
    return;
  }
  
  const header = await parseHeader(file.path);
  await indexSpec(db, file.path, header);
  await routeToAgent(file.path, header);
});

// Agent finished handler
events.on("agent.finished", async (agent: { name: string, session: string }) => {
  const lastEdit = await getLastEditTime(db);
  const quiet = Date.now() - lastEdit > QUIET_PERIOD;
  
  if (quiet && await allAgentsIdle()) {
    await runPipeline();
  }
});

// Session idle handler
events.on("session.idle", async (session: string) => {
  await releaseOwnership(session);
});
```

#### 3. Skill System (skills.ts)
```typescript
interface Skill {
  name: string;
  trigger: (event: FileEvent) => boolean;
  execute: (context: SkillContext) => Promise<void>;
}

const SKILLS: Skill[] = [
  {
    name: 'spec-writer',
    trigger: (e) => e.path.startsWith('specs/') && e.kind === 'modify',
    execute: expandSpec
  },
  {
    name: 'code-gen',
    trigger: (e) => e.path.endsWith('.spec.md') && e.depth > 0,
    execute: generateCode
  },
  {
    name: 'test-writer',
    trigger: (e) => e.path.startsWith('src/') && !e.path.includes('.test.'),
    execute: writeTests
  },
  {
    name: 'back-sync',
    trigger: (e) => e.path.startsWith('src/') && e.kind === 'modify',
    execute: syncToSpec
  }
];
```

#### 4. Git Integration (git.ts)
```typescript
// Commit-per-file pattern
async function commitFile(filepath: string, message: string) {
  await exec(`git add "${filepath}"`);
  await exec(`git commit -m "${message}"`);
}

// Auto-commit on spec changes
async function onSpecChange(filepath: string, summary: string) {
  const header = await parseHeader(filepath);
  const msg = `[spec] ${header.id}: ${summary}`;
  await commitFile(filepath, msg);
}
```

#### 5. Convergence Detection (convergence.ts)
```typescript
const QUIET_PERIOD = 30_000; // 30 seconds

class ConvergenceDetector {
  private lastEvent: number = Date.now();
  private timer?: NodeJS.Timeout;
  
  onEvent() {
    this.lastEvent = Date.now();
    clearTimeout(this.timer);
    this.scheduleCheck();
  }
  
  private scheduleCheck() {
    this.timer = setTimeout(() => {
      if (Date.now() - this.lastEvent >= QUIET_PERIOD) {
        this.onConverged();
      }
    }, QUIET_PERIOD);
  }
  
  private async onConverged() {
    // Run pipeline: build, test, commit
    await runBuild();
    await runTests();
    await commitAll();
  }
}
```

#### 6. Tools Registration (tools.ts)
```typescript
const TOOLS = [
  {
    name: 'speclang_search',
    description: 'Search specs by content',
    handler: searchSpecs
  },
  {
    name: 'speclang_get_spec',
    description: 'Get spec by ID',
    handler: getSpec
  },
  {
    name: 'speclang_list_specs',
    description: 'List all specs',
    handler: listSpecs
  },
  {
    name: 'speclang_index_refresh',
    description: 'Rebuild spec index',
    handler: refreshIndex
  }
];
```

### Configuration
```yaml
# .speclang/opencode.yaml
build_mode: POC  # POC, MVP, Alpha, Enterprise

model_assignments:
  north-star: claude-opus
  spec-writer: claude-sonnet
  code-gen: claude-sonnet
  test-writer: claude-sonnet
  
commit_style: per_file  # per_file, per_convergence
quiet_period: 30s
```

## Test Cases
1. Plugin loads without errors
2. File edit triggers spec indexing
3. Agent finished triggers convergence check
4. Skills load and execute correctly
5. Git commits per file on changes
6. SSE streams events to clients
7. Tools respond correctly

## Validation
```bash
# Load plugin in OpenCode
opencode serve --build-mode --project=/path/to/speclang

# Test plugin loaded
curl http://localhost:3000/plugins/speclang/status

# Test tools
opencode tool speclang_search --query "auth"
```

## Output Format
After completing, output:
1. Plugin files created
2. Skills registered
3. Tools available
4. Event handlers active
