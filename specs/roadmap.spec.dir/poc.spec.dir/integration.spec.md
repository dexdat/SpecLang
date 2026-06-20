# speclang-header lines:10
id: "@speclang/roadmap/poc/integration"
parent: "@ref:specs/roadmap/poc"
version: 0.1.0
layer: 2
short: "How all POC components integrate"
tags: [poc, integration, architecture, wiring]
project_level: Alpha
agent_support: agent_autonomous
---

# POC: Component Integration

How all POC components wire together.

## Architecture

### @poc/integration/architecture

**Components:**
```
┌─────────────────────────────────────────┐
│              speclangd                   │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ FileWatcher  │──│ EventRouter  │    │
│  └──────────────┘  └──────┬───────┘    │
│                           │            │
│                    ┌──────▼──────┐     │
│                    │ SimpleAgent │     │
│                    └──────┬──────┘     │
│                           │            │
│                    ┌──────▼──────┐     │
│                    │  CodeGen    │     │
│                    └─────────────┘     │
└─────────────────────────────────────────┘
```

**Data Flow:**
1. FileWatcher emits `file-changed` event
2. EventRouter calls SimpleAgent
3. SimpleAgent parses spec, calls CodeGen
4. CodeGen writes files, creates symlinks
5. SimpleAgent emits `complete` event

## Wiring Code

### @poc/integration/wiring

```typescript
// src/daemon/daemon.ts

import { FileWatcher } from './file-watcher';
import { EventRouter } from './event-routing';
import { SimpleAgent } from './simple-agent';
import { ConvergenceDetector } from './convergence';

export class Daemon {
  private watcher: FileWatcher;
  private router: EventRouter;
  private agent: SimpleAgent;
  private convergence: ConvergenceDetector;
  
  async start(): Promise<void> {
    // 1. Create components
    this.agent = new SimpleAgent();
    this.router = new EventRouter(this.agent);
    this.watcher = new FileWatcher();
    this.convergence = new ConvergenceDetector();
    
    // 2. Wire events
    this.watcher.on('file-changed', (event) => {
      this.convergence.onFileChange(event.path);
      this.router.route(event);
    });
    
    this.convergence.on('converged', (event) => {
      console.log(`✅ Cascade converged (${event.duration}ms)`);
    });
    
    // 3. Start watching
    await this.watcher.watch('./specs');
    
    console.log('speclangd running. Watching specs/...');
  }
}
```

## Startup Sequence

### @poc/integration/startup

```bash
# 1. Initialize
$ ./bin/speclangd
[14:32:00] Initializing daemon...
[14:32:00] Loading configuration...
[14:32:00] Starting file watcher...
[14:32:00] ✅ Daemon ready. Watching specs/

# 2. Detect existing specs
[14:32:00] Found 5 existing specs
[14:32:00] Processing initial specs...
[14:32:01] ✅ Initial cascade complete

# 3. Wait for changes
[14:32:01] Waiting for file changes...
```

## Configuration (POC)

### @poc/integration/config

**Simple config for POC:**
```yaml
# .speclang/config.yaml
watch:
  directory: ./specs
  recursive: true
  debounce: 300  # ms

cascade:
  quiet_period: 5000  # 5 seconds for convergence
  max_depth: 10       # Safety limit

agent:
  type: simple        # Single agent for POC
  
output:
  code_directory: ./src
  use_symlinks: true
```

## Error Handling (POC)

### @poc/integration/errors

**POC Error Strategy:**
- Log error
- Skip problematic file
- Continue processing others
- **No retry logic for POC** (add in MVP)

```typescript
async route(event: FileEvent): Promise<void> {
  try {
    await this.agent.onFileChanged(event);
  } catch (error) {
    console.error(`[Error] Processing ${event.path}:`, error);
    // POC: Just log and continue
    // MVP: Retry, escalate, etc.
  }
}
```

## Testing Integration

### @poc/integration/testing

**End-to-End Test:**
```typescript
// tests/poc.integration.test.ts

describe('POC Integration', () => {
  it('should generate code on spec change', async () => {
    // 1. Start daemon
    const daemon = new Daemon();
    await daemon.start();
    
    // 2. Create a spec
    await fs.writeFile('specs/test.spec.md', `
# speclang-header lines:5
id: "@test/demo"
version: 1.0.0
---

### @block::hello @kind:function
Hello function.
`);
    
    // 3. Wait for cascade
    await waitForConvergence(5000);
    
    // 4. Verify code generated
    const code = await fs.readFile('src/test/hello.ts', 'utf-8');
    expect(code).toContain('export function hello');
    
    // 5. Verify it builds
    await exec('npm run build');
  });
});
```
