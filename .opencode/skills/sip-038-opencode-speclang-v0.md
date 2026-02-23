---
name: sip-038-opencode-speclang-v0
title: "SIP 38: OpenCode Integration"
version: 0.1.0
description: SpecLang integration with OpenCode runtime
category: standard
---

# SIP 38: OpenCode Integration

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines OpenCode Integration—using OpenCode as SpecLang's initial runtime.

### Quick Start

OpenCode provides:
- HTTP server with SSE for real-time events
- Native plugin system
- File watcher across platforms
- Session management and SQLite persistence
- Skills system for agent behavior

### When to Read This

- **Setup**: Installing SpecLang plugin
- **Events**: Understanding event flow
- **Convergence**: How convergence works

### Related SIPs

- SIP 10: Daemon
- SIP 25: Skills
- SIP 28: Cascade Protocol
- SIP 39: Deployment Modes

## Abstract

This SIP defines OpenCode Integration—SpecLang's initial implementation using OpenCode as the runtime. OpenCode provides the foundation for SpecLang's reactive cascade: HTTP server, SSE events, plugin system, file watching, and session management.

## Motivation

SpecLang needs a runtime that provides:
- Real-time file watching
- Event-driven architecture
- Plugin extensibility
- Persistent storage
- Multi-model AI support

OpenCode provides all of this out of the box.

## Rationale

**OpenCode as foundation:**

1. **Built-in**: No need to build from scratch
2. **Proven**: Already supports similar workflows
3. **Extensible**: Plugin system for custom logic
4. **Portable**: Works across platforms

## Specification

### Architecture

```yaml
OpenCodeArchitecture:
  components:
    OpenCode:
      provides:
        - HTTP server
        - SSE endpoint
        - File watcher
        - SQLite persistence
        - Session management
        - Multi-model support
        
    Plugin:
      location: "~/.opencode/plugins/speclang.ts"
      responsibilities:
        - Parse spec headers
        - Update SQLite index
        - Route events to skills
        - Enforce file-ownership rules
        - Detect convergence
        
    Skills:
      location: ".opencode/skills/"
      types:
        - SpecWriter
        - CodeGen
        - Tester
        
    SQLite:
      schema: "SpecLang index"
      tables:
        - specs
        - blocks
        - references
        - events
```

### Quick Start

```bash
opencode serve --build-mode --project=/path/to/speclang
```

The plugin will:
1. Watch the project directory for spec file changes
2. Parse headers and update the SQLite index
3. Route events to the appropriate skill
4. Enforce file-ownership rules
5. Detect convergence after 30 seconds of inactivity
6. Run the pipeline (build, test, commit) when converged

### Sub-Specifications

```yaml
SubSpecs:
  events:
    id: "@speclang/opencode/events"
    content:
      - "File watching strategies"
      - "Session events (file.edited, agent.finished, etc.)"
      - "Convergence detection (30-second quiet period)"
      
  integration:
    id: "@speclang/opencode/integration"
    content:
      - "Plugin architecture and code"
      - "SQLite schema and queries"
      - "Tools exposed to agents"
      - "Skills loading and routing"
      - "Git integration (commit-per-file)"
      - "Build profiles (POC, MVP, Enterprise)"
      - "Multi-model assignment"
```

### Event System

```yaml
EventSystem:
  file_watching:
    strategy: "OpenCode native"
    events:
      - "file.created"
      - "file.edited"
      - "file.deleted"
      
  session_events:
    - "session.started"
    - "file.edited"
    - "agent.started"
    - "agent.finished"
    - "cascade.propagated"
    - "cascade.converged"
    
  sse_endpoint:
    path: "/events"
    format: "Server-Sent Events"
    
  convergence_detection:
    quiet_period: "30 seconds"
    trigger: "No events for 30 seconds"
    action: "Run pipeline"
```

### Plugin Structure

```yaml
PluginStructure:
  file: "~/.opencode/plugins/speclang.ts"
  
  exports:
    name: "speclang"
    version: "0.1.0"
    
  hooks:
    onFileChange: "(path, content) => void"
    onAgentFinish: "(agent, result) => void"
    onConvergence: "() => void"
    
  tools:
    - "speclang/parse-header"
    - "speclang/validate-refs"
    - "speclang/generate-code"
    - "speclang/run-tests"
```

### SQLite Schema

```yaml
SQLiteSchema:
  tables:
    specs:
      columns:
        - id: "TEXT PRIMARY KEY"
        - path: "TEXT"
        - version: "TEXT"
        - layer: "INTEGER"
        - tags: "JSON"
        - header: "JSON"
        - updated_at: "DATETIME"
        
    blocks:
      columns:
        - id: "TEXT PRIMARY KEY"
        - spec_id: "TEXT"
        - kind: "TEXT"
        - content: "TEXT"
        - references: "JSON"
        
    events:
      columns:
        - id: "INTEGER PRIMARY KEY"
        - type: "TEXT"
        - source: "TEXT"
        - data: "JSON"
        - timestamp: "DATETIME"
```

### Build Profiles

```yaml
BuildProfiles:
  POC:
    description: "Experimental, minimal validation"
    validation: "basic"
    tests: "optional"
    
  MVP:
    description: "Core functionality validated"
    validation: "standard"
    tests: "required"
    
  Alpha:
    description: "Internal testing, incomplete features"
    validation: "strict"
    tests: "required"
    
  Beta:
    description: "External testing, feature complete"
    validation: "strict"
    tests: "comprehensive"
    
  Enterprise:
    description: "Maximum scale, strict governance"
    validation: "strictest"
    tests: "comprehensive"
    compliance: "required"
```

### Multi-Model Assignment

```yaml
MultiModel:
  strategy: "Assign models per agent type"
  
  assignments:
    SpecWriter:
      model: "claude-3-opus"
      reason: "High quality writing"
      
    CodeGen:
      model: "claude-3-sonnet"
      reason: "Fast code generation"
      
    Tester:
      model: "claude-3-haiku"
      reason: "Quick test writing"
      
    Orchestrator:
      model: "claude-3-opus"
      reason: "Complex planning"
```

## Examples

### Example 1: Plugin Entry Point

```typescript
// ~/.opencode/plugins/speclang.ts
export default {
  name: 'speclang',
  version: '0.1.0',
  
  async onActivate(context) {
    this.db = context.sqlite;
    this.watcher = context.fileWatcher;
    this.events = context.events;
    
    await this.initSchema();
    await this.indexSpecs();
  },
  
  async onFileChange(path: string, content: string) {
    if (path.endsWith('.spec.md') || path.endsWith('.spec.yaml')) {
      const header = this.parseHeader(content);
      await this.updateIndex(path, header);
      this.events.emit('spec.updated', { path, header });
    }
  },
  
  async onConvergence() {
    await this.runPipeline();
  },
  
  async runPipeline() {
    await this.build();
    await this.test();
    await this.commit();
  }
};
```

### Example 2: Event Flow

```yaml
event_flow:
  1_file_edited:
    trigger: "User edits specs/auth.spec.md"
    event: "file.edited"
    
  2_header_parsed:
    action: "Plugin parses header"
    event: "header.parsed"
    
  3_index_updated:
    action: "SQLite updated"
    event: "index.updated"
    
  4_cascade_triggered:
    action: "Cascade starts"
    event: "cascade.started"
    
  5_agents_run:
    action: "SpecWriter runs"
    event: "agent.started"
    
  6_convergence:
    trigger: "30 seconds quiet"
    event: "cascade.converged"
    
  7_pipeline:
    action: "Build, test, commit"
    event: "pipeline.finished"
```

### Example 3: Configuration

```yaml
# .speclang/config.yaml
opencode:
  plugin: "~/.opencode/plugins/speclang.ts"
  
  events:
    sse_endpoint: "/events"
    convergence_timeout: 30
    
  sqlite:
    path: ".speclang/index.db"
    
  build:
    profile: "Alpha"
    target: "./src"
    language: "typescript"
    
  models:
    SpecWriter: "claude-3-opus"
    CodeGen: "claude-3-sonnet"
    Tester: "claude-3-haiku"
```

## Implementation

```typescript
import { Plugin, FileWatcherEvent, AgentResult } from 'opencode';

interface SpecLangConfig {
  buildProfile: 'POC' | 'MVP' | 'Alpha' | 'Beta' | 'Enterprise';
  convergenceTimeout: number;
  models: Record<string, string>;
}

export default class SpecLangPlugin implements Plugin {
  name = 'speclang';
  version = '0.1.0';
  
  private config: SpecLangConfig;
  private lastEventTime: number = 0;
  private convergenceTimer: NodeJS.Timeout | null = null;
  
  async onActivate(context: PluginContext): Promise<void> {
    this.config = await this.loadConfig(context);
    this.setupFileWatcher(context);
    this.setupConvergenceDetection();
  }
  
  private setupFileWatcher(context: PluginContext): void {
    context.fileWatcher.on('change', async (event: FileWatcherEvent) => {
      if (this.isSpecFile(event.path)) {
        this.lastEventTime = Date.now();
        await this.handleSpecChange(event.path, event.content);
      }
    });
  }
  
  private setupConvergenceDetection(): void {
    setInterval(() => {
      const quiet = Date.now() - this.lastEventTime;
      if (quiet > this.config.convergenceTimeout * 1000) {
        this.onConvergence();
      }
    }, 5000);
  }
  
  private async handleSpecChange(path: string, content: string): Promise<void> {
    const header = this.parseHeader(content);
    await this.updateIndex(path, header);
    this.startCascade(header);
  }
  
  private async onConvergence(): Promise<void> {
    await this.runPipeline();
  }
  
  private async runPipeline(): Promise<void> {
    await this.build();
    await this.test();
    await this.commit();
  }
}
```

## References

- @ref:speclang/opencode
- @ref:speclang/opencode/events
- @ref:speclang/opencode/integration
- SIP 10: Daemon
- SIP 25: Skills
- SIP 28: Cascade Protocol
- SIP 39: Deployment Modes

## Copyright

This document is in the public domain.
