# speclang-header lines:7
id: "@speclang/roadmap/poc/poc-daemon"
parent: "@ref:specs/roadmap/poc"version: 0.1.0
layer: 2
short: "Main entry point for POC daemon"
tags: [poc, daemon, entry-point, main]
---

# POC: Daemon Entry Point

Main entry point that wires all POC components together.

## Architecture

### @poc/daemon/architecture

**Components:**
```
┌─────────────────────────────────────┐
│           PocDaemon                 │
│  ┌─────────┐      ┌──────────┐    │
│  │Watcher  │──────│ Router   │    │
│  └────┬────┘      └────┬─────┘    │
│       │                │          │
│       │           ┌────┴────┐     │
│       │           │ Agent   │     │
│       │           └────┬────┘     │
│       │                │          │
│       │           ┌────┴────┐     │
│       │           │Converge │     │
│       │           └─────────┘     │
│       │                           │
│       └────────────────────────►   │
│                    (reset timer)    │
└─────────────────────────────────────┘
```

## Wiring

### @poc/daemon/wiring

```typescript
import { FileWatcher } from './file-watcher';
import { EventRouter } from './event-routing';
import { SimpleAgent } from './simple-agent';
import { ConvergenceDetector } from './convergence';
import { FileEvent } from './types';

export class PocDaemon {
  private watcher: FileWatcher;
  private router: EventRouter;
  private agent: SimpleAgent;
  private convergence: ConvergenceDetector;
  
  constructor() {
    // Create components
    this.agent = new SimpleAgent();
    this.router = new EventRouter(this.agent);
    this.watcher = new FileWatcher();
    this.convergence = new ConvergenceDetector();
    
    // Wire events
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    // File change → Router → Agent
    this.watcher.on('change', (event) => {
      this.router.route(event);
    });
    
    // File change → Convergence tracker
    this.watcher.on('change', (event) => {
      this.convergence.onFileChange(event.path);
    });
    
    // Convergence detected
    this.convergence.on('converged', (event) => {
      console.log(`✅ Cascade converged (${event.duration}ms)`);
      console.log(`   Files changed: ${event.filesChanged.length}`);
    });
  }
  
  async start(): Promise<void> {
    console.log('Starting speclangd POC...');
    
    await this.watcher.watch('./specs');
    
    console.log('✅ speclangd running. Watching specs/');
    console.log('   Edit a spec file to see the cascade in action!');
  }
  
  async stop(): Promise<void> {
    await this.watcher.stop();
    console.log('speclangd stopped');
  }
}
```

## CLI Entry

### @poc/daemon/cli

**bin/speclangd-poc:**
```bash
#!/usr/bin/env node

import { PocDaemon } from '../src/daemon/poc-daemon';

const daemon = new PocDaemon();

daemon.start().catch((error) => {
  console.error('Failed to start:', error);
  process.exit(1);
});

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await daemon.stop();
  process.exit(0);
});
```

## Configuration

### @poc/daemon/config

**POC uses hardcoded config (no config files needed):**

```typescript
const POC_CONFIG = {
  watch: {
    directory: './specs',
    debounce: 300,        // ms
    ignore: ['*.tmp', '*~', '.git/**']
  },
  convergence: {
    quietPeriod: 5000,    // 5 seconds
    maxDepth: 10          // safety limit
  },
  output: {
    codeDir: './src',
    useSymlinks: true
  }
};
```

## Startup Sequence

### @poc/daemon/startup

**Initial Startup Processing:**
1. Load configuration
2. Initialize database
3. Start file watcher
4. **Scan existing specs** ← NEW
5. Process any existing specs
6. Wait for new changes

**Why scan existing specs?**
- Ensure all specs have generated code
- Handle daemon restart gracefully
- Catch up on changes while daemon was down

**Startup Log:**
```
$ ./bin/speclangd-poc

[14:32:00] Starting speclangd POC...
[14:32:00] Initializing file watcher...
[14:32:00] Scanning existing specs...
[14:32:00] Found: 12 specs
[14:32:00] Processing existing specs...
[14:32:01]   specs/hello.spec.md → already up to date
[14:32:01]   specs/auth.spec.md → generating 3 files...
[14:32:02]   specs/utils.spec.md → already up to date
[14:32:02] ✅ Initial processing complete
[14:32:02] ✅ speclangd running. Watching specs/
[14:32:02] Edit a spec file to see the cascade!

[14:32:05] Change detected: specs/hello.spec.md
[14:32:05] Agent processing...
[14:32:06] ✅ Generated: src/hello/index.ts
[14:32:11] ✅ Cascade converged (6000ms)
           Files changed: 1
```

**Implementation:**
```typescript
export class PocDaemon {
  /**
   * Process existing specs on startup
   */
  private async processExistingSpecs(): Promise<void> {
    console.log('[Daemon] Scanning existing specs...');
    
    // Find all .spec.md files
    const { glob } = await import('glob');
    const specFiles = await glob('**/*.spec.md', {
      cwd: this.config.watchDirectory,
      absolute: true
    });
    
    console.log(`[Daemon] Found: ${specFiles.length} specs`);
    
    // Process each spec
    for (const filePath of specFiles) {
      try {
        await this.processSpecFile(filePath);
      } catch (error) {
        console.error(`[Daemon] Failed to process ${filePath}:`, error);
        // Continue with other specs
      }
    }
    
    console.log('[Daemon] ✅ Initial processing complete');
  }
  
  /**
   * Process a single spec file
   */
  private async processSpecFile(filePath: string): Promise<void> {
    // Check if already up to date
    if (await this.isUpToDate(filePath)) {
      console.log(`[Daemon]   ${filePath} → already up to date`);
      return;
    }
    
    console.log(`[Daemon]   ${filePath} → processing...`);
    
    // Create file event
    const event: FileEvent = {
      type: 'modified',
      path: filePath,
      timestamp: Date.now()
    };
    
    // Route to agent
    await this.router.route(event);
  }
  
  /**
   * Check if spec is up to date
   * Compares spec file mtime to the most recent generated file mtime
   */
  private async isUpToDate(filePath: string): Promise<boolean> {
    const { stat, readdir } = await import('fs/promises');
    const { join } = await import('path');
    
    try {
      const specStat = await stat(filePath);
      const generatedDir = this.getGeneratedPath(filePath);
      
      // Check if generated directory exists
      const dirStat = await stat(generatedDir).catch(() => null);
      if (!dirStat || !dirStat.isDirectory()) {
        return false; // No generated code directory
      }
      
      // Read all generated files and find the newest
      const files = await readdir(generatedDir);
      if (files.length === 0) {
        return false; // Directory exists but empty
      }
      
      // Find the most recently modified generated file
      let newestMtime = 0;
      for (const file of files) {
        if (file.endsWith('.ts')) {
          const fileStat = await stat(join(generatedDir, file));
          if (fileStat.mtimeMs > newestMtime) {
            newestMtime = fileStat.mtimeMs;
          }
        }
      }
      
      if (newestMtime === 0) {
        return false; // No TypeScript files found
      }
      
      // Check if generated code is newer than spec
      return newestMtime >= specStat.mtimeMs;
    } catch {
      return false;
    }
  }
  
  private getGeneratedPath(specPath: string): string {
    // Convert spec path to expected generated path
    // specs/hello.spec.md → specs/hello.spec.dir/src/
    return specPath.replace('.spec.md', '.spec.dir/src');
  }
}
```

## Error Handling

### @poc/daemon/errors

**POC Strategy: Log and continue**

```typescript
private setupErrorHandling(): void {
  this.watcher.on('error', (error) => {
    console.error('[Watcher Error]', error);
    // Continue running
  });
  
  this.agent.on('error', (error, event) => {
    console.error('[Agent Error]', error);
    console.error('  File:', event.path);
    // Skip this file, continue with others
  });
}
```

## Testing

### @poc/daemon/testing

```typescript
describe('PocDaemon', () => {
  it('should start and watch for changes', async () => {
    const daemon = new PocDaemon();
    await daemon.start();
    
    // Simulate file change
    await fs.writeFile('specs/test.spec.md', '# Test');
    
    // Wait for processing
    await wait(1000);
    
    // Verify code was generated
    expect(await fs.exists('src/test/index.ts')).toBe(true);
    
    await daemon.stop();
  });
});
```

## Logging

### @poc/daemon/logging

**Simple console logging (no structured logging for POC):**

```typescript
console.log('[Watcher] Change detected:', path);
console.log('[Agent] Processing:', specId);
console.log('[Agent] Generated:', filePath);
console.log('[Converge] Cascade complete:', duration);
```

**Colors (optional):**
```typescript
const colors = {
  info: '\x1b[36m',    // Cyan
  success: '\x1b[32m', // Green
  error: '\x1b[31m',  // Red
  reset: '\x1b[0m'
};

console.log(`${colors.success}✅${colors.reset} Generated: ${path}`);
```
