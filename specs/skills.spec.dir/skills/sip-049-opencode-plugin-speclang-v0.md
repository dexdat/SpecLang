---
name: sip-049-opencode-plugin-speclang-v0
title: "SIP 49: OpenCode Plugin"
version: 0.1.0
description: TypeScript plugin for OpenCode integrating SpecLang reactive cascade system
category: standard
---
# speclang-header lines:5
# id: @specs/skills
# version: 1.0.0
# layer: 5


# SIP 49: OpenCode Plugin

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines the OpenCode Plugin—a TypeScript plugin that integrates SpecLang's reactive cascade system into the OpenCode editor/IDE.

### Quick Start

Plugin provides:
1. **Event handling**: Respond to file changes, spec updates
2. **Session management**: Track agent sessions and ownership
3. **MCP integration**: Model Context Protocol client
4. **Git integration**: Per-file commits, history, blame
5. **Convergence detection**: Know when cascade settles

### When to Read This

- **Plugin development**: Building or extending the plugin
- **Integration**: Understanding how SpecLang connects to OpenCode
- **Event flow**: Debugging reactive behavior

### Related SIPs

- SIP 6: Agent Protocol
- SIP 7: Cascade System
- SIP 11: MCP Tools
- SIP 30: Git History

## Abstract

This SIP defines the OpenCode Plugin architecture—a TypeScript plugin that bridges SpecLang's reactive cascade system with the OpenCode editor. The plugin handles events, manages sessions, provides MCP client integration, and ensures convergence detection.

## Motivation

SpecLang needs editor integration:
- See spec changes in real-time
- Track which agent owns which file
- Query spec history and blame
- Know when cascade converges
- Use MCP tools from editor

The OpenCode Plugin provides this integration.

## Rationale

**Plugin architecture:**

1. **Event-driven**: React to file changes, agent actions
2. **Session-scoped**: Each agent has isolated state
3. **MCP client**: Communicate with language servers
4. **Git-aware**: Per-file commits and history
5. **Convergence monitor**: Detect stable state

## Specification

### Plugin Architecture

```yaml
OpenCodePlugin:
  entry_point: "src/plugin/index.ts"
  
  components:
    event_system:
      description: "Event emission and subscription"
      file: "src/plugin/events.ts"
      
    session_manager:
      description: "Agent session lifecycle"
      file: "src/plugin/session.ts"
      
    ownership_guard:
      description: "File ownership enforcement"
      file: "src/plugin/ownership.ts"
      
    mcp_client:
      description: "MCP protocol client"
      file: "src/plugin/mcp.ts"
      
    git_integration:
      description: "Git operations wrapper"
      file: "src/plugin/git.ts"
      
    convergence_monitor:
      description: "Cascade convergence detection"
      file: "src/plugin/convergence.ts"
      
    tool_registry:
      description: "SpecLang tools for OpenCode"
      file: "src/plugin/tools.ts"
```

### Event System

```yaml
EventSystem:
  events:
    spec_changed:
      payload:
        path: string
        change_type: create | modify | delete
        old_content: string | null
        new_content: string | null
      handlers:
        - "Update _index.json"
        - "Trigger dependent agents"
        - "Check convergence"
        
    agent_started:
      payload:
        agent_id: string
        session_id: string
        owned_files: string[]
      handlers:
        - "Register session"
        - "Mark files as owned"
        
    agent_finished:
      payload:
        agent_id: string
        session_id: string
        outputs: string[]
        success: boolean
      handlers:
        - "Release ownership"
        - "Create git commits"
        - "Notify dependents"
        
    cascade_triggered:
      payload:
        trigger_file: string
        trigger_agent: string
        cascade_depth: number
      handlers:
        - "Start convergence monitor"
        
    cascade_converged:
      payload:
        total_files_changed: number
        total_agents_involved: number
        duration_ms: number
      handlers:
        - "Stop convergence monitor"
        - "Generate summary"
```

### Session Manager

```yaml
SessionManager:
  responsibilities:
    - "Create agent sessions"
    - "Track active sessions"
    - "Enforce ownership rules"
    - "Handle session cleanup"
    
  session_schema:
    Session:
      id: string
      agent_id: string
      created_at: number
      expires_at: number
      owned_files: string[]
      status: active | expired | completed
      parent_session: string | null
      
  api:
    create_session:
      params:
        agent_id: string
        requested_files: string[]
        parent_session: string | null
      returns: Session
      errors:
        - "Files already owned by another session"
        - "Agent quota exceeded"
        
    release_session:
      params:
        session_id: string
      returns: void
      side_effects:
        - "Release file ownership"
        - "Trigger cascade if files modified"
        
    extend_session:
      params:
        session_id: string
        additional_time_ms: number
      returns: Session
```

### Ownership Guard

```yaml
OwnershipGuard:
  rules:
    - "Only session owner can modify file"
    - "Ownership is session-scoped"
    - "Read access always allowed"
    - "Write requires ownership check"
    
  enforcement:
    on_write_attempt:
      1: "Check if file is owned by any session"
      2: "If owned, verify current session is owner"
      3: "If not owned or wrong owner, reject"
      
  conflict_resolution:
    strategy: "first_wins"
    override: "human_only with explicit force"
    
  api:
    check_ownership:
      params:
        file_path: string
        session_id: string
      returns:
        owned: boolean
        owner_session: string | null
        
    acquire_ownership:
      params:
        file_path: string
        session_id: string
      returns:
        success: boolean
        reason: string | null
```

### MCP Client

```yaml
MCPClient:
  protocol_version: "2024-11-05"
  
  capabilities:
    tools: true
    resources: true
    prompts: false
    
  connection:
    transport: stdio | http | websocket
    server_command: "speclang-mcp-server"
    
  tools_provided:
    speclang_index:
      description: "Get spec index"
      params: {}
      returns: SpecIndex
      
    speclang_get:
      description: "Get spec by ID"
      params:
        id: string
      returns: Spec | null
      
    speclang_references:
      description: "Find references to block"
      params:
        block_id: string
      returns: Reference[]
      
    speclang_validate:
      description: "Validate spec"
      params:
        path: string
        level: number
      returns: ValidationResult
      
    speclang_history:
      description: "Get git history for file"
      params:
        path: string
        limit: number
      returns: Commit[]
      
    speclang_blame:
      description: "Get blame for file"
      params:
        path: string
      returns: BlameLine[]
```

### Git Integration

```yaml
GitIntegration:
  commit_strategy: per_file
  
  operations:
    commit_file:
      params:
        path: string
        message: string
        agent: string
      returns:
        commit_hash: string
        
    history:
      params:
        path: string
        limit: number
      returns: CommitHistory
      
    blame:
      params:
        path: string
      returns: BlameInfo
      
    rollback_file:
      params:
        path: string
        commit_hash: string | null
      returns:
        success: boolean
        previous_content: string
        
  commit_message_format:
    template: "speclang: {summary}"
    examples:
      - "speclang: added auth entities to specs/auth.spec.md"
      - "speclang: generated auth.go from auth spec"
      - "speclang: cascade update from session abc123"
```

### Convergence Detection

```yaml
ConvergenceMonitor:
  detection_strategy: timeout + quiescence
  
  parameters:
    quiescence_timeout_ms: 5000
    max_cascade_depth: 10
    max_total_time_ms: 300000
    
  states:
    idle: "No cascade in progress"
    active: "Cascade running, changes detected"
    converging: "No changes for quiescence_timeout"
    converged: "Cascade complete"
    diverged: "Cascade exceeded limits"
    
  algorithm:
    on_file_change:
      1: "Reset quiescence timer"
      2: "Increment change counter"
      3: "If depth > max, mark diverged"
      
    on_quiescence_timeout:
      1: "Check if any agents still active"
      2: "If no active agents, mark converged"
      3: "Emit cascade_converged event"
      
  api:
    get_status:
      returns:
        state: string
        files_changed: number
        agents_involved: string[]
        elapsed_ms: number
```

### Configuration

```yaml
PluginConfig:
  file: ".speclang/opencode-plugin.yaml"
  
  schema:
    enabled: boolean (default: true)
    
    session:
      default_ttl_ms: number (default: 300000)
      max_concurrent: number (default: 10)
      
    git:
      auto_commit: boolean (default: true)
      commit_prefix: string (default: "speclang:")
      
    convergence:
      quiescence_timeout_ms: number (default: 5000)
      max_cascade_depth: number (default: 10)
      
    mcp:
      server_command: string (default: "speclang-mcp-server")
      connection_timeout_ms: number (default: 10000)
```

## Examples

### Example 1: Plugin Initialization

```typescript
import { SpecLangPlugin } from "@speclang/opencode-plugin";

const plugin = new SpecLangPlugin({
  enabled: true,
  session: {
    defaultTtlMs: 300000,
    maxConcurrent: 10,
  },
  git: {
    autoCommit: true,
    commitPrefix: "speclang:",
  },
  convergence: {
    quiescenceTimeoutMs: 5000,
    maxCascadeDepth: 10,
  },
});

await plugin.initialize();

plugin.events.on("cascade_converged", (event) => {
  console.log(`Cascade converged: ${event.total_files_changed} files changed`);
  console.log(`Duration: ${event.duration_ms}ms`);
});
```

### Example 2: Session Management

```typescript
const session = await plugin.sessions.create({
  agentId: "spec-writer",
  requestedFiles: ["specs/auth.spec.md", "specs/auth-entities.spec.md"],
  parentSession: null,
});

console.log(`Session created: ${session.id}`);
console.log(`Owned files: ${session.owned_files.join(", ")}`);

try {
  await plugin.files.write("specs/auth.spec.md", newContent, session.id);
} catch (error) {
  if (error.code === "OWNERSHIP_VIOLATION") {
    console.error("File not owned by this session");
  }
}

await plugin.sessions.release(session.id);
```

### Example 3: Event Handling

```typescript
plugin.events.on("spec_changed", async (event) => {
  console.log(`Spec changed: ${event.path}`);
  console.log(`Change type: ${event.change_type}`);
  
  const refs = await plugin.mcp.tools.speclang_references({
    block_id: extractBlockId(event.path),
  });
  
  for (const ref of refs) {
    console.log(`  Referenced by: ${ref.spec_id}#${ref.block_id}`);
  }
});

plugin.events.on("agent_finished", async (event) => {
  if (event.success) {
    for (const output of event.outputs) {
      await plugin.git.commitFile({
        path: output,
        message: `agent ${event.agent_id} completed`,
        agent: event.agent_id,
      });
    }
  }
});
```

### Example 4: Convergence Monitoring

```typescript
const status = plugin.convergence.getStatus();

if (status.state === "active") {
  console.log("Cascade in progress:");
  console.log(`  Files changed: ${status.files_changed}`);
  console.log(`  Agents involved: ${status.agents_involved.join(", ")}`);
  console.log(`  Elapsed: ${status.elapsed_ms}ms`);
}

plugin.convergence.waitForConvergence().then((result) => {
  console.log("Cascade converged!");
  console.log(`Total changes: ${result.total_files_changed}`);
  console.log(`Total agents: ${result.agents_involved.length}`);
});
```

## Implementation

```typescript
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

interface PluginConfig {
  enabled: boolean;
  session: { defaultTtlMs: number; maxConcurrent: number };
  git: { autoCommit: boolean; commitPrefix: string };
  convergence: { quiescenceTimeoutMs: number; maxCascadeDepth: number };
  mcp: { serverCommand: string; connectionTimeoutMs: number };
}

interface Session {
  id: string;
  agentId: string;
  createdAt: number;
  expiresAt: number;
  ownedFiles: string[];
  status: "active" | "expired" | "completed";
  parentSession: string | null;
}

interface ConvergenceStatus {
  state: "idle" | "active" | "converging" | "converged" | "diverged";
  filesChanged: number;
  agentsInvolved: string[];
  elapsedMs: number;
}

class SpecLangPlugin extends EventEmitter {
  private sessions: Map<string, Session> = new Map();
  private fileOwnership: Map<string, string> = new Map();
  private convergenceTimer: NodeJS.Timeout | null = null;
  private convergenceStatus: ConvergenceStatus = {
    state: "idle",
    filesChanged: 0,
    agentsInvolved: [],
    elapsedMs: 0,
  };
  private convergenceStartTime: number = 0;

  constructor(private config: PluginConfig) {
    super();
  }

  async initialize(): Promise<void> {
    await this.connectMcp();
    this.startCleanupTimer();
  }

  sessions = {
    create: async (options: {
      agentId: string;
      requestedFiles: string[];
      parentSession: string | null;
    }): Promise<Session> => {
      if (this.sessions.size >= this.config.session.maxConcurrent) {
        throw new Error("Max concurrent sessions exceeded");
      }

      for (const file of options.requestedFiles) {
        if (this.fileOwnership.has(file)) {
          throw new Error(`File ${file} already owned by another session`);
        }
      }

      const session: Session = {
        id: uuidv4(),
        agentId: options.agentId,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.session.defaultTtlMs,
        ownedFiles: options.requestedFiles,
        status: "active",
        parentSession: options.parentSession,
      };

      this.sessions.set(session.id, session);
      for (const file of options.requestedFiles) {
        this.fileOwnership.set(file, session.id);
      }

      this.emit("agent_started", {
        agentId: session.agentId,
        sessionId: session.id,
        ownedFiles: session.ownedFiles,
      });

      return session;
    },

    release: async (sessionId: string): Promise<void> => {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      for (const file of session.ownedFiles) {
        this.fileOwnership.delete(file);
      }

      session.status = "completed";
      this.sessions.delete(sessionId);

      this.emit("agent_finished", {
        agentId: session.agentId,
        sessionId: session.id,
        outputs: session.ownedFiles,
        success: true,
      });
    },

    extend: async (sessionId: string, additionalTimeMs: number): Promise<Session> => {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error("Session not found");
      session.expiresAt += additionalTimeMs;
      return session;
    },
  };

  ownership = {
    check: (filePath: string, sessionId: string): { owned: boolean; ownerSession: string | null } => {
      const owner = this.fileOwnership.get(filePath);
      return {
        owned: owner === sessionId,
        ownerSession: owner || null,
      };
    },

    acquire: (filePath: string, sessionId: string): { success: boolean; reason: string | null } => {
      const currentOwner = this.fileOwnership.get(filePath);
      if (currentOwner && currentOwner !== sessionId) {
        return { success: false, reason: `File owned by session ${currentOwner}` };
      }
      this.fileOwnership.set(filePath, sessionId);
      return { success: true, reason: null };
    },
  };

  convergence = {
    getStatus: (): ConvergenceStatus => ({ ...this.convergenceStatus }),

    waitForConvergence: (): Promise<{ totalFilesChanged: number; agentsInvolved: string[] }> => {
      return new Promise((resolve) => {
        const check = () => {
          if (this.convergenceStatus.state === "converged") {
            resolve({
              totalFilesChanged: this.convergenceStatus.filesChanged,
              agentsInvolved: this.convergenceStatus.agentsInvolved,
            });
          } else {
            this.once("cascade_converged", check);
          }
        };
        check();
      });
    },
  };

  handleFileChange(filePath: string, changeType: "create" | "modify" | "delete"): void {
    if (this.convergenceStatus.state === "idle") {
      this.convergenceStatus.state = "active";
      this.convergenceStartTime = Date.now();
      this.convergenceStatus.filesChanged = 0;
      this.convergenceStatus.agentsInvolved = [];
      this.emit("cascade_triggered", {
        triggerFile: filePath,
        triggerAgent: "unknown",
        cascadeDepth: 0,
      });
    }

    this.convergenceStatus.filesChanged++;
    this.resetConvergenceTimer();

    this.emit("spec_changed", {
      path: filePath,
      changeType,
      oldContent: null,
      newContent: null,
    });
  }

  private resetConvergenceTimer(): void {
    if (this.convergenceTimer) {
      clearTimeout(this.convergenceTimer);
    }

    this.convergenceStatus.state = "converging";

    this.convergenceTimer = setTimeout(() => {
      this.convergenceStatus.state = "converged";
      this.convergenceStatus.elapsedMs = Date.now() - this.convergenceStartTime;

      this.emit("cascade_converged", {
        totalFilesChanged: this.convergenceStatus.filesChanged,
        totalAgentsInvolved: this.convergenceStatus.agentsInvolved.length,
        durationMs: this.convergenceStatus.elapsedMs,
      });

      this.convergenceStatus = {
        state: "idle",
        filesChanged: 0,
        agentsInvolved: [],
        elapsedMs: 0,
      };
    }, this.config.convergence.quiescenceTimeoutMs);
  }

  private async connectMcp(): Promise<void> {}

  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessions) {
        if (session.expiresAt < now) {
          session.status = "expired";
          for (const file of session.ownedFiles) {
            this.fileOwnership.delete(file);
          }
          this.sessions.delete(id);
        }
      }
    }, 60000);
  }

  mcp = {
    tools: {
      speclang_index: async () => {
        return {};
      },
      speclang_get: async (params: { id: string }) => {
        return null;
      },
      speclang_references: async (params: { block_id: string }) => {
        return [];
      },
      speclang_validate: async (params: { path: string; level: number }) => {
        return { passed: true, issues: [] };
      },
      speclang_history: async (params: { path: string; limit: number }) => {
        return [];
      },
      speclang_blame: async (params: { path: string }) => {
        return [];
      },
    },
  };

  git = {
    commitFile: async (options: { path: string; message: string; agent: string }): Promise<{ commitHash: string }> => {
      return { commitHash: "abc123" };
    },
    history: async (options: { path: string; limit: number }) => {
      return [];
    },
    blame: async (options: { path: string }) => {
      return [];
    },
    rollbackFile: async (options: { path: string; commitHash: string | null }) => {
      return { success: true, previousContent: "" };
    },
  };
}

export { SpecLangPlugin, PluginConfig, Session, ConvergenceStatus };
```

## References

- @ref:speclang/opencode-plugin
- @ref:speclang/agent-protocol
- @ref:speclang/cascade
- @ref:speclang/mcp
- SIP 6: Agent Protocol
- SIP 7: Cascade System
- SIP 11: MCP Tools
- SIP 30: Git History

## Copyright

This document is in the public domain.
