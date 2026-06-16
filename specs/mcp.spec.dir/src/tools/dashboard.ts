/**
 * SPECLANG-GENERATED: MCP Dashboard/UI Tools
 * Source: @speclang/mcp-ui-tools
 */

import os from 'os';
import fs from 'fs';
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { MCPServerConfig } from '../types.js';

interface SSEEventType {
  file_change: string[];
  cascade_progress: string[];
  agent_activity: string[];
  convergence: string[];
}

/**
 * Dashboard tool handler for UI monitoring tools
 */
export class DashboardToolHandler {
  private db: SpecLangDB;
  private config: MCPServerConfig | null;
  private statsCache: {
    cpuPercent: number;
    memoryUsedMb: number;
    memoryTotalMb: number;
    diskUsedMb: number;
    diskTotalMb: number;
    uptimeSeconds: number;
    timestamp: number;
  } | null = null;
  private cacheInterval = 5000;

  constructor(db: SpecLangDB, config?: MCPServerConfig) {
    this.db = db;
    this.config = config || null;
  }

  /**
   * Handle speclang_query_events - Query recent cascade events with filtering
   */
  async handleQueryEvents(args: {
    limit?: number;
    cascade_id?: string;
    agent?: string;
    file_pattern?: string;
    since?: string;
  }): Promise<{
    events: Array<{
      event_id: number;
      cascade_id: string;
      kind: string;
      path: string;
      session: string;
      details: string;
      timestamp: string;
    }>;
  }> {
    const { limit = 20, cascade_id, agent, file_pattern, since } = args;
    const db = this.db.getDatabase();

    let sql = `
      SELECT 
        e.id as event_id,
        e.cascade_id,
        e.kind,
        e.path,
        e.session,
        e.details,
        datetime(e.timestamp, 'unixepoch') as timestamp
      FROM events e
      WHERE 1=1
    `;
    const params: (string | number | null)[] = [];

    if (cascade_id) {
      sql += ' AND e.cascade_id = ?';
      params.push(cascade_id);
    }
    if (agent) {
      sql += ' AND e.session = ?';
      params.push(agent);
    }
    if (file_pattern) {
      sql += ' AND e.path LIKE ?';
      params.push(`${file_pattern}%`);
    }
    if (since) {
      sql += ' AND e.timestamp >= ?';
      params.push(Math.floor(new Date(since).getTime() / 1000));
    }

    sql += ' ORDER BY e.timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(sql).all(...params) as Array<{
      event_id: number;
      cascade_id: string;
      kind: string;
      path: string;
      session: string;
      details: string;
      timestamp: string;
    }>;

    return { events: rows };
  }

  /**
   * Handle speclang_get_agent_statuses - Get detailed status for all agent sessions
   */
  async handleGetAgentStatuses(args: {
    agent_type?: string;
    status?: string;
  }): Promise<{
    sessions: Array<{
      session_id: string;
      agent: string;
      status: string;
      current_file: string | null;
      queue_depth: number;
      last_active: string;
      uptime_seconds: number;
    }>;
  }> {
    const { agent_type, status } = args;
    const db = this.db.getDatabase();

    let sql = `
      SELECT 
        s.id as session_id,
        s.agent,
        s.status,
        null as current_file,
        (SELECT COUNT(*) FROM commands c WHERE c.session_id = s.id AND c.status = 'pending') as queue_depth,
        datetime(s.last_active, 'unixepoch') as last_active,
        0 as uptime_seconds
      FROM sessions s
      WHERE 1=1
    `;
    const params: (string | null)[] = [];

    if (agent_type) {
      sql += ' AND s.agent = ?';
      params.push(agent_type);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY s.last_active DESC';

    const rows = db.prepare(sql).all(...params) as Array<{
      session_id: string;
      agent: string;
      status: string;
      current_file: string | null;
      queue_depth: number;
      last_active: string;
      uptime_seconds: number;
    }>;

    return { sessions: rows };
  }

  /**
   * Handle speclang_get_project_stats - Get project statistics
   */
  async handleGetProjectStats(): Promise<{
    specs_count: number;
    generated_files_count: number;
    test_files_count: number;
    total_files: number;
    cascade_active: boolean;
    cascade_depth: number | null;
    queue_depth: number;
  }> {
    const db = this.db.getDatabase();

    const specsCount = db.prepare('SELECT COUNT(*) as count FROM specs').get() as { count: number };
    const generatedFilesCount = db.prepare("SELECT COUNT(*) as count FROM specs WHERE file_path LIKE 'generated/%'").get() as { count: number };
    const testFilesCount = db.prepare("SELECT COUNT(*) as count FROM specs WHERE file_path LIKE 'tests/%'").get() as { count: number };
    const cascadeActive = db.prepare("SELECT COUNT(*) as count FROM cascades WHERE status = 'cascading'").get() as { count: number };
    const cascadeDepth = db.prepare("SELECT MAX(depth) as max_depth FROM cascades WHERE status = 'cascading'").get() as { max_depth: number | null };
    const queueDepth = db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'pending'").get() as { count: number };

    return {
      specs_count: specsCount.count,
      generated_files_count: generatedFilesCount.count,
      test_files_count: testFilesCount.count,
      total_files: specsCount.count,
      cascade_active: cascadeActive.count > 0,
      cascade_depth: cascadeDepth.max_depth,
      queue_depth: queueDepth.count
    };
  }

  /**
   * Handle speclang_get_queue_status - Get detailed queue status
   */
  async handleGetQueueStatus(args: {
    limit?: number;
  }): Promise<{
    commands: Array<{
      command_id: string;
      action: string;
      target_file: string | null;
      session_id: string | null;
      priority: number;
      created_at: string;
      age_seconds: number;
    }>;
  }> {
    const { limit = 50 } = args;
    const db = this.db.getDatabase();

    const rows = db.prepare(`
      SELECT 
        c.id as command_id,
        c.action,
        c.target as target_file,
        c.session_id,
        0 as priority,
        datetime(c.created_at, 'unixepoch') as created_at,
        (strftime('%s','now') - c.created_at) as age_seconds
      FROM commands c
      WHERE c.status = 'pending'
      ORDER BY c.created_at ASC
      LIMIT ?
    `).all(limit) as Array<{
      command_id: string;
      action: string;
      target_file: string | null;
      session_id: string | null;
      priority: number;
      created_at: string;
      age_seconds: number;
    }>;

    return { commands: rows };
  }

  /**
   * Handle speclang_get_system_stats - Get system-level statistics
   */
  async handleGetSystemStats(): Promise<{
    cpu_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
    disk_used_mb: number;
    disk_total_mb: number;
    uptime_seconds: number;
  }> {
    const now = Date.now();

    if (this.statsCache && (now - this.statsCache.timestamp) < this.cacheInterval) {
      return {
        cpu_percent: this.statsCache.cpuPercent,
        memory_used_mb: this.statsCache.memoryUsedMb,
        memory_total_mb: this.statsCache.memoryTotalMb,
        disk_used_mb: this.statsCache.diskUsedMb,
        disk_total_mb: this.statsCache.diskTotalMb,
        uptime_seconds: this.statsCache.uptimeSeconds
      };
    }

    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    const cpuPercent = Math.round((1 - totalIdle / totalTick) * 100);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsedMb = Math.round((totalMem - freeMem) / (1024 * 1024));
    const memoryTotalMb = Math.round(totalMem / (1024 * 1024));

    let diskUsedMb = 0;
    let diskTotalMb = 0;

    try {
      const stats = fs.statfsSync('.');
      diskTotalMb = Math.round((stats.bsize * stats.blocks) / (1024 * 1024));
      diskUsedMb = Math.round((stats.bsize * (stats.blocks - stats.bfree)) / (1024 * 1024));
    } catch {
      diskTotalMb = 0;
      diskUsedMb = 0;
    }

    const uptimeSeconds = Math.round(os.uptime());

    this.statsCache = {
      cpuPercent,
      memoryUsedMb,
      memoryTotalMb,
      diskUsedMb,
      diskTotalMb,
      uptimeSeconds,
      timestamp: now
    };

    return {
      cpu_percent: cpuPercent,
      memory_used_mb: memoryUsedMb,
      memory_total_mb: memoryTotalMb,
      disk_used_mb: diskUsedMb,
      disk_total_mb: diskTotalMb,
      uptime_seconds: uptimeSeconds
    };
  }

  /**
   * Handle speclang_subscribe_events - Get SSE endpoint info for real-time updates
   */
  async handleSubscribeEvents(args: {
    types?: string[];
  }): Promise<{
    endpoint: string;
    event_types: string[];
    connection_info: string;
  }> {
    const { types } = args;
    
    const availableTypes = [
      'file.changed',
      'cascade.progress', 
      'agent.spawned',
      'agent.completed',
      'cascade.converged'
    ];
    
    const eventTypes = types && types.length > 0 
      ? availableTypes.filter(t => types.includes(t))
      : availableTypes;
    
    const queryParams = eventTypes.length < availableTypes.length 
      ? `?types=${eventTypes.join(',')}`
      : '';
    
    const ssePort = this.config?.port || 3000;
    const sseHost = this.config?.host || 'localhost';
    
    return {
      endpoint: `http://${sseHost}:${ssePort}/events${queryParams}`,
      event_types: eventTypes,
      connection_info: 'Connect to the SSE endpoint using EventSource API. Events will be streamed as JSON with fields: type, data, timestamp.'
    };
  }
}
