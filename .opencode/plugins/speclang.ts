// speclang-header lines:20
// id: @generated/opencode-plugin
// target: typescript
// produces: .opencode/plugins/speclang.ts
// layer: 10
// refs: [@ref:specs/opencode-plugin]
// ---
// @block:plugin/main @kind:code
/**
 * Speclang OpenCode Plugin
 * 
 * TypeScript plugin for OpenCode that integrates Speclang reactive cascade system.
 * 
 * Location: .opencode/plugins/speclang.ts
 * Version: 0.2.0
 * 
 * Generated from @ref:specs/opencode-plugin
 */

import { Plugin, events, opencode, tools } from '@opencode-ai/plugin';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

// ============================================================================
// Configuration Types
// ============================================================================

interface MCPAuthConfig {
  type: 'none' | 'basic' | 'token';
  user?: string;
  pass?: string;
  token?: string;
}

interface MCPConfig {
  command: string;
  transport: 'stdio' | 'http';
  port?: number;
  host?: string;
  auth?: MCPAuthConfig;
}

interface AgentConfig {
  max_concurrent: number;
  timeout: number;
}

interface ConvergenceConfig {
  quiet_period: number;
  max_depth: number;
}

interface GitConfig {
  auto_commit: boolean;
  commit_message_template: string;
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file: string;
}

interface PluginConfig {
  watch_patterns: string[];
  ignore_patterns: string[];
  mcp_server: MCPConfig;
  agents: Record<string, AgentConfig>;
  convergence: ConvergenceConfig;
  git: GitConfig;
  logging: LoggingConfig;
}

// ============================================================================
// Event Types
// ============================================================================

interface FileWatcherEvent {
  path: string;
  changeType: 'create' | 'modify' | 'delete';
}

interface FileEditedEvent {
  path: string;
  contentHash: string;
}

interface SessionToolCalledEvent {
  tool_name: string;
  args: any;
  session_id: string;
}

interface SessionIdleEvent {
  session_id: string;
}

// ============================================================================
// MCP Client
// ============================================================================

/**
 * MCP Client for SQLite access
 */
class MCPClient {
  private config: MCPConfig;
  private cache: Map<string, { value: any; expires: number }> = new Map();

  constructor(config: MCPConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // Connection logic would be implemented based on MCP SDK
    // For now, this is a placeholder
    console.log('MCPClient connecting to', this.config);
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    // Check cache for read queries
    const cacheKey = `${sql}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    // Simulate query - in real implementation would call MCP server
    console.log('MCPClient query:', sql, params);
    const result: any[] = [];

    // Cache SELECT results
    if (sql.trim().toLowerCase().startsWith('select')) {
      this.cache.set(cacheKey, {
        value: result,
        expires: Date.now() + 30000 // 30s TTL
      });
    }

    return result;
  }

  async execute(sql: string, params?: any[]): Promise<number> {
    // Invalidate cache on writes
    if (!sql.trim().toLowerCase().startsWith('select')) {
      this.cache.clear();
    }

    // Simulate execute - in real implementation would call MCP server
    console.log('MCPClient execute:', sql, params);
    return 0;
  }

  async search(query: string, limit?: number): Promise<any[]> {
    console.log('MCPClient search:', query, limit);
    return [];
  }

  async getStatus(): Promise<any> {
    console.log('MCPClient getStatus');
    return {};
  }

  invalidateCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Session Manager
// ============================================================================

interface Session {
  id: string;
  agent: string;
  status: 'idle' | 'active' | 'done' | 'error';
  current_file: string;
  cascade_id: string;
  last_active: number;
}

class SessionManager {
  private db: MCPClient;
  private activeSessions: Map<string, Session> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(db: MCPClient) {
    this.db = db;
  }

  async spawnSession(agentType: string, filePath: string): Promise<Session> {
    // Check limits
    const count = await this.getActiveCount(agentType);
    const config = await this.getAgentConfig(agentType);

    if (count >= config.max_concurrent) {
      throw new Error(`Max concurrent ${agentType} sessions reached`);
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const cascadeId = await this.getActiveCascadeId(filePath);
    
    await this.db.execute(
      `INSERT INTO sessions (session_id, agent, status, current_file, cascade_id) 
       VALUES (?, ?, 'idle', ?, ?)`,
      [sessionId, agentType, filePath, cascadeId]
    );

    // Set timeout
    const timeout = setTimeout(
      () => this.handleTimeout(sessionId),
      config.timeout * 1000
    );
    this.timeouts.set(sessionId, timeout);

    // Spawn OpenCode agent
    const session = {
      id: sessionId,
      agent: agentType,
      status: 'idle',
      current_file: filePath,
      cascade_id: cascadeId,
      last_active: Date.now()
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  async notify(sessionId: string, event: any): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      // Spawn new session
      const agentType = await this.getAgentForFile(event.path);
      await this.spawnSession(agentType, event.path);
      return;
    }

    // Send event to agent (simulated)
    console.log('Sending event to session', sessionId, event);

    // Update last active
    await this.db.execute(
      `UPDATE sessions SET last_active = strftime('%s','now') 
       WHERE session_id = ?`,
      [sessionId]
    );
  }

  async completeSession(sessionId: string, status: 'done' | 'error' = 'done'): Promise<void> {
    // Clear timeout
    const timeout = this.timeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(sessionId);
    }

    await this.db.execute(
      `UPDATE sessions SET status = ?, ended_at = strftime('%s','now') WHERE session_id = ?`,
      [status, sessionId]
    );

    this.activeSessions.delete(sessionId);
  }

  private async getActiveCascadeId(filePath: string): Promise<string> {
    const rows = await this.db.query(
      `SELECT cascade_id FROM cascades WHERE status = 'active' LIMIT 1`
    );
    if (rows.length > 0) {
      return rows[0].cascade_id;
    }
    // Create new cascade
    const cascadeId = crypto.randomUUID();
    await this.db.execute(
      `INSERT INTO cascades (cascade_id, root_trigger, status) VALUES (?, ?, 'active')`,
      [cascadeId, filePath]
    );
    return cascadeId;
  }

  private async handleTimeout(sessionId: string): Promise<void> {
    await this.db.execute(
      `UPDATE sessions SET status = 'error', error_message = 'Timeout'
       WHERE session_id = ?`,
      [sessionId]
    );
    
    // Create recovery command
    await this.db.execute(
      `INSERT INTO commands (command_id, cascade_id, session_id, action, target_file, status)
       VALUES (?, (SELECT cascade_id FROM sessions WHERE session_id = ?), ?, 'unstick', (SELECT current_file FROM sessions WHERE session_id = ?), 'pending')`,
      [crypto.randomUUID(), sessionId, sessionId, sessionId]
    );
    
    this.activeSessions.delete(sessionId);
    this.timeouts.delete(sessionId);
  }

  private async getActiveCount(agentType: string): Promise<number> {
    const rows = await this.db.query(
      `SELECT COUNT(*) as count FROM sessions WHERE agent = ? AND status IN ('idle', 'active')`,
      [agentType]
    );
    return rows[0]?.count || 0;
  }

  private async getAgentConfig(agentType: string): Promise<AgentConfig> {
    // Default config
    const defaultConfig: AgentConfig = {
      max_concurrent: 5,
      timeout: 300
    };
    return defaultConfig;
  }

  private async getAgentForFile(filePath: string): Promise<string> {
    // Map file path to agent type based on patterns
    if (filePath.match(/\.spec\.(md|yaml|yml|scl)$/) || filePath.includes('specs/')) {
      return 'spec-writer';
    } else if (filePath.endsWith('.go')) {
      return 'code-gen-go';
    } else if (filePath.match(/\.test\.spec\.(md|yaml|yml|scl)$/)) {
      return 'test-writer';
    } else {
      return 'spec-writer';
    }
  }
}

// ============================================================================
// Ownership Guard
// ============================================================================

class OwnershipGuard {
  private db: MCPClient;
  private exemptSessions: Set<string> = new Set();

  constructor(db: MCPClient) {
    this.db = db;
  }

  async checkWrite(sessionId: string, filePath: string): Promise<boolean> {
    // Check exemption
    if (this.exemptSessions.has(sessionId)) {
      return true;
    }
    
    // Get file owner
    const result = await this.db.query(
      `SELECT owner_session_id FROM specs WHERE file_path = ?`,
      [filePath]
    );
    
    if (!result || result.length === 0) {
      // File not in database yet, check if session can create it
      const canCreate = await this.canCreateFile(sessionId, filePath);
      if (!canCreate) {
        await this.logViolation(sessionId, filePath, 'create_not_allowed');
        return false;
      }
      return true;
    }
    
    if (result[0].owner_session_id !== sessionId) {
      await this.logViolation(sessionId, filePath, 'wrong_owner');
      return false;
    }
    
    return true;
  }
  
  async interceptWrite(
    sessionId: string, 
    filePath: string, 
    content: string
  ): Promise<boolean> {
    const allowed = await this.checkWrite(sessionId, filePath);
    
    if (!allowed) {
      // Show error in OpenCode
      await opencode.showNotification({
        type: 'error',
        message: `Session ${sessionId} cannot write ${filePath}`,
        actions: [
          { label: 'View Owner', command: 'speclang.showOwner' },
          { label: 'Request Transfer', command: 'speclang.requestTransfer' }
        ]
      });
      
      // Log violation
      await this.db.execute(
        `INSERT INTO error_logs (source, file, session_id, message, level)
         VALUES ('plugin', ?, ?, ?, 'error')`,
        [filePath, sessionId, `Write blocked: session does not own file`]
      );
      
      return false;
    }
    
    return true;
  }
  
  exempt(sessionId: string): void {
    this.exemptSessions.add(sessionId);
  }
  
  unexempt(sessionId: string): void {
    this.exemptSessions.delete(sessionId);
  }

  private async canCreateFile(sessionId: string, filePath: string): Promise<boolean> {
    // Simple logic: spec-writer can create spec files, etc.
    const agentType = await this.getAgentForFile(filePath);
    const session = await this.getSession(sessionId);
    return session?.agent === agentType;
  }

  private async logViolation(sessionId: string, filePath: string, reason: string): Promise<void> {
    await this.db.execute(
      `INSERT INTO error_logs (source, file, session_id, message, level)
       VALUES ('plugin', ?, ?, ?, 'error')`,
      [filePath, sessionId, `Ownership violation: ${reason}`]
    );
  }

  private async getAgentForFile(filePath: string): Promise<string> {
    // Same logic as SessionManager
    if (filePath.match(/\.spec\.(md|yaml|yml|scl)$/) || filePath.includes('specs/')) {
      return 'spec-writer';
    } else if (filePath.endsWith('.go')) {
      return 'code-gen-go';
    } else if (filePath.match(/\.test\.spec\.(md|yaml|yml|scl)$/)) {
      return 'test-writer';
    } else {
      return 'spec-writer';
    }
  }

  private async getSession(sessionId: string): Promise<any> {
    const rows = await this.db.query(
      `SELECT * FROM sessions WHERE session_id = ?`,
      [sessionId]
    );
    return rows[0];
  }
}

// ============================================================================
// Git Handler
// ============================================================================

class GitHandler {
  private db: MCPClient;

  constructor(db: MCPClient) {
    this.db = db;
  }

  async commitFile(
    filePath: string, 
    message: string, 
    sessionId: string
  ): Promise<string> {
    try {
      // Stage only this file using spawn to avoid injection
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('git', ['add', '--only', filePath]);
        proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`git add exited with code ${code}`)));
      });
      
      // Commit with message using spawn to avoid injection
      const commitHash = await new Promise<string>((resolve, reject) => {
        const proc = spawn('git', ['commit', '-m', `speclang: ${message}`]);
        let stdout = '';
        proc.stdout.on('data', (data) => stdout += data.toString());
        proc.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(`git commit exited with code ${code}`)));
      });
      
      // Extract hash from output
      const hash = commitHash.match(/\[.*\s+([a-f0-9]+)\]/)?.[1] || '';
      
      // Update SQLite
      await this.db.execute(
        `UPDATE specs SET git_commit = ? WHERE file_path = ?`,
        [hash, filePath]
      );
      
      // Log commit
      await this.db.execute(
        `INSERT INTO git_commits (file_path, commit_hash, message, author, session_id)
         VALUES (?, ?, ?, (SELECT agent FROM sessions WHERE session_id = ?), ?)`,
        [filePath, hash, message, sessionId, sessionId]
      );
      
      return hash;
    } catch (error: any) {
      // Handle failure
      await this.db.execute(
        `INSERT INTO error_logs (source, file, message, level)
         VALUES ('git', ?, ?, 'error')`,
        [filePath, error.message]
      );
      throw error;
    }
  }
}

// ============================================================================
// Main Plugin Class
// ============================================================================

class SpeclangPlugin {
  private db: MCPClient;
  private sessionManager: SessionManager;
  private guard: OwnershipGuard;
  private gitHandler: GitHandler;
  private config: PluginConfig;

  constructor() {
    // Load configuration
    this.config = this.loadDefaultConfig();
    
    // Initialize components
    this.db = new MCPClient(this.config.mcp_server);
    this.sessionManager = new SessionManager(this.db);
    this.guard = new OwnershipGuard(this.db);
    this.gitHandler = new GitHandler(this.db);
  }

  async initialize(): Promise<void> {
    await this.db.connect();
    this.registerEventHandlers();
    console.log('Speclang plugin initialized');
  }

  private loadDefaultConfig(): PluginConfig {
    return {
      watch_patterns: [
        "**/*.spec.{md,yaml,yml,scl}",
        "**/*.{go,ts,py}.spec",
        "**/project.scl"
      ],
      ignore_patterns: [
        ".speclang/**",
        "*.log",
        "reports/**",
        ".git/**"
      ],
      mcp_server: {
        command: "speclang mcp start",
        transport: "stdio" as const
      },
      agents: {
        "spec-writer": {
          max_concurrent: 10,
          timeout: 300
        },
        "code-gen-go": {
          max_concurrent: 5,
          timeout: 120
        }
      },
      convergence: {
        quiet_period: 30,
        max_depth: 100
      },
      git: {
        auto_commit: true,
        commit_message_template: "speclang: {summary}"
      },
      logging: {
        level: "info",
        file: ".speclang/plugin.log"
      }
    };
  }

  private registerEventHandlers(): void {
    events.on("file.watcher.updated", async (event: FileWatcherEvent) => {
      await this.onFileWatcherUpdated(event);
    });

    events.on("file.edited", async (event: FileEditedEvent) => {
      await this.onFileEdited(event);
    });

    events.on("session.tool_called", async (event: SessionToolCalledEvent) => {
      await this.onSessionToolCalled(event);
    });

    events.on("session.idle", async (event: SessionIdleEvent) => {
      await this.onSessionIdle(event);
    });
  }

  private async ensureActiveCascade(rootTrigger: string): Promise<string> {
    // Get existing active cascade
    const rows = await this.db.query(
      `SELECT cascade_id FROM cascades WHERE status = 'active' LIMIT 1`
    );
    if (rows.length > 0) {
      return rows[0].cascade_id;
    }
    // Create new cascade
    const cascadeId = crypto.randomUUID();
    await this.db.execute(
      `INSERT INTO cascades (cascade_id, root_trigger, status) VALUES (?, ?, 'active')`,
      [cascadeId, rootTrigger]
    );
    return cascadeId;
  }
  
  private async getActiveCascadeId(): Promise<string | null> {
    const rows = await this.db.query(
      `SELECT cascade_id FROM cascades WHERE status = 'active' LIMIT 1`
    );
    return rows.length > 0 ? rows[0].cascade_id : null;
  }

  async onFileWatcherUpdated(event: FileWatcherEvent): Promise<void> {
    // Only process spec files
    if (!this.isSpecFile(event.path)) {
      return;
    }
    
    // Update event log in SQLite
    const cascadeId = await this.ensureActiveCascade(event.path);
    let fileHashAfter = null;
    if (event.changeType !== 'delete') {
      fileHashAfter = await this.hashFile(event.path);
    }
    const details = JSON.stringify({
      changeType: event.changeType,
      timestamp: Date.now()
    });
    await this.db.execute(
      `INSERT INTO events (cascade_id, kind, path, session_id, file_hash_before, file_hash_after, details) VALUES (?, ?, ?, NULL, NULL, ?, ?)`,
      [cascadeId, event.changeType, event.path, fileHashAfter, details]
    );
    
    // Route to owning agent
    const owner = await this.getFileOwner(event.path);
    if (owner) {
      await this.sessionManager.notify(owner, event);
    }
  }
  
  async onFileEdited(event: FileEditedEvent): Promise<void> {
    // Validate header
    const header = await this.parseHeader(event.path);
    if (!header.valid) {
      await this.showError(`Invalid header in ${event.path}: ${header.error}`);
      return;
    }
    
    // Update SQLite index
    await this.indexSpec(event.path, header);
  }

  private async indexSpec(filePath: string, header: any): Promise<void> {
    // Determine owning session based on file path pattern
    const sessionId = await this.getOwningSession(filePath);
    const content = await this.readFileContent(filePath);
    const headerRaw = header.raw || content.split('---')[0] + '---';
    await this.db.execute(
      `INSERT OR REPLACE INTO specs (file_path, id, header_lines, header_raw, content_raw, owner_session_id, owned_by, content_hash, short_desc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        filePath,
        header.id,
        header.lines,
        headerRaw,
        content,
        sessionId,
        this.getAgentType(filePath),
        await this.hashFile(filePath),
        header.short || ''
      ]
    );
  }

  private async getOwningSession(filePath: string): Promise<string | null> {
    // Find session that owns this file pattern
    const rows = await this.db.query(
      `SELECT session_id FROM sessions WHERE status IN ('active', 'idle') AND agent = ?`,
      [this.getAgentType(filePath)]
    );
    return rows.length > 0 ? rows[0].session_id : null;
  }

  private async getFileOwner(filePath: string): Promise<string | null> {
    const rows = await this.db.query(
      `SELECT owner_session_id FROM specs WHERE file_path = ?`,
      [filePath]
    );
    return rows.length > 0 ? rows[0].owner_session_id : null;
  }

  private getAgentType(filePath: string): string {
    // Map file path to agent type based on patterns
    if (filePath.match(/\.spec\.(md|yaml|yml|scl)$/) || filePath.includes('specs/')) {
      return 'spec-writer';
    } else if (filePath.endsWith('.go')) {
      return 'code-gen-go';
    } else if (filePath.match(/\.test\.spec\.(md|yaml|yml|scl)$/)) {
      return 'test-writer';
    } else {
      return 'spec-writer';
    }
  }

  private isSpecFile(filePath: string): boolean {
    // Simple check for spec file extensions
    return filePath.match(/\.spec\.(md|yaml|yml|scl)$/) !== null || 
           filePath.endsWith('project.scl');
  }

  private async readFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  private async parseHeader(filePath: string): Promise<any> {
    const content = await this.readFileContent(filePath);
    const lines = content.split('\n');
    if (!lines[0].includes('speclang-header')) {
      return { valid: false, error: 'Missing speclang-header' };
    }
    const match = lines[0].match(/speclang-header lines:(\d+)/);
    if (!match) {
      return { valid: false, error: 'Invalid header format' };
    }
    const headerLines = parseInt(match[1], 10);
    const headerRaw = lines.slice(0, headerLines).join('\n');
    // Parse YAML after the first line
    const yamlText = lines.slice(1, headerLines - 1).join('\n');
    let parsed;
    try {
      parsed = yaml.parse(yamlText);
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
    return {
      valid: true,
      id: parsed.id,
      lines: headerLines,
      short: parsed.short,
      raw: headerRaw,
      ...parsed
    };
  }

  private async hashFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async showError(message: string): Promise<void> {
    await opencode.showNotification({
      type: 'error',
      message,
      actions: []
    });
  }

  async onSessionToolCalled(event: SessionToolCalledEvent): Promise<void> {
    // Log for debugging
    console.log('Session tool called:', event);
  }

  async onSessionIdle(event: SessionIdleEvent): Promise<void> {
    // Trigger convergence check
    await this.checkConvergence();
  }

  private async checkConvergence(): Promise<void> {
    // Check all convergence signals
    const [events, commands, sessions] = await Promise.all([
      this.db.query(`SELECT COUNT(*) as count FROM events WHERE processed = 0`),
      this.db.query(`SELECT COUNT(*) as count FROM commands WHERE status = 'pending'`),
      this.db.query(`SELECT COUNT(*) as count FROM sessions WHERE status IN ('active', 'idle')`)
    ]);
    
    const noEvents = events[0]?.count === 0;
    const noCommands = commands[0]?.count === 0;
    const noActiveSessions = sessions[0]?.count === 0;
    
    if (noEvents && noCommands && noActiveSessions) {
      // All signals converged
      await this.markCascadeConverged();
    }
  }

  private async markCascadeConverged(): Promise<void> {
    const cascadeId = await this.getActiveCascadeId();
    if (!cascadeId) {
      return; // No active cascade
    }
    await this.db.execute(
      `UPDATE cascades SET status = 'converged', converged_at = strftime('%s','now') WHERE cascade_id = ?`,
      [cascadeId]
    );
    // Trigger pipeline
    await this.triggerPipeline(cascadeId);
  }

  private async triggerPipeline(cascadeId: string): Promise<void> {
    // Notify pipeline that cascade converged
    await this.db.execute(
      `INSERT INTO commands (command_id, cascade_id, action, target_file, status) VALUES (?, ?, 'run-tests', NULL, 'pending')`,
      [crypto.randomUUID(), cascadeId]
    );
  }
}

// ============================================================================
// Plugin Entry Point
// ============================================================================

const plugin = new SpeclangPlugin();

export default {
  name: 'speclang',
  version: '0.2.0',
  description: 'Speclang reactive cascade integration for OpenCode',
  
  async onLoad() {
    await plugin.initialize();
  },
  
  async onUnload() {
    // Cleanup
  },
  
  tools: {
    speclang_search: async (params: { query: string, limit?: number, tags?: string[] }) => {
      console.log('speclang_search called:', params);
      return [];
    },
    
    speclang_find_dependents: async (params: { id: string }) => {
      console.log('speclang_find_dependents called:', params);
      return [];
    },
    
    speclang_get_tree: async (params: { id: string, depth?: number }) => {
      console.log('speclang_get_tree called:', params);
      return { tree: [] };
    },
    
    speclang_validate: async (params: { file_path: string }) => {
      console.log('speclang_validate called:', params);
      return { valid: true, errors: [] };
    },
    
    speclang_split_if_needed: async (params: { file_path: string, max_tokens?: number }) => {
      console.log('speclang_split_if_needed called:', params);
      return { split: false };
    },
    
    speclang_get_status: async () => {
      console.log('speclang_get_status called');
      return { 
        active_sessions: 0,
        queue_depth: 0,
        converged: true,
        cascade_depth: 0
      };
    },
    
    speclang_insert_command: async (params: { action: string, target_file?: string, payload?: any }) => {
      console.log('speclang_insert_command called:', params);
      return { command_id: crypto.randomUUID() };
    }
  }
};