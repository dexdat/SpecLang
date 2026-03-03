"use strict";
/**
 * SPECLANG-GENERATED: MCP Dashboard/UI Tools
 * Source: @speclang/mcp-ui-tools
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardToolHandler = void 0;
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
/**
 * Dashboard tool handler for UI monitoring tools
 */
class DashboardToolHandler {
    db;
    config;
    statsCache = null;
    cacheInterval = 5000;
    constructor(db, config) {
        this.db = db;
        this.config = config || null;
    }
    /**
     * Handle speclang_query_events - Query recent cascade events with filtering
     */
    async handleQueryEvents(args) {
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
        const params = [];
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
        const rows = db.prepare(sql).all(...params);
        return { events: rows };
    }
    /**
     * Handle speclang_get_agent_statuses - Get detailed status for all agent sessions
     */
    async handleGetAgentStatuses(args) {
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
        const params = [];
        if (agent_type) {
            sql += ' AND s.agent = ?';
            params.push(agent_type);
        }
        if (status) {
            sql += ' AND s.status = ?';
            params.push(status);
        }
        sql += ' ORDER BY s.last_active DESC';
        const rows = db.prepare(sql).all(...params);
        return { sessions: rows };
    }
    /**
     * Handle speclang_get_project_stats - Get project statistics
     */
    async handleGetProjectStats() {
        const db = this.db.getDatabase();
        const specsCount = db.prepare('SELECT COUNT(*) as count FROM specs').get();
        const generatedFilesCount = db.prepare("SELECT COUNT(*) as count FROM specs WHERE file_path LIKE 'generated/%'").get();
        const testFilesCount = db.prepare("SELECT COUNT(*) as count FROM specs WHERE file_path LIKE 'tests/%'").get();
        const cascadeActive = db.prepare("SELECT COUNT(*) as count FROM cascades WHERE status = 'cascading'").get();
        const cascadeDepth = db.prepare("SELECT MAX(depth) as max_depth FROM cascades WHERE status = 'cascading'").get();
        const queueDepth = db.prepare("SELECT COUNT(*) as count FROM commands WHERE status = 'pending'").get();
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
    async handleGetQueueStatus(args) {
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
    `).all(limit);
        return { commands: rows };
    }
    /**
     * Handle speclang_get_system_stats - Get system-level statistics
     */
    async handleGetSystemStats() {
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
        const cpus = os_1.default.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        const cpuPercent = Math.round((1 - totalIdle / totalTick) * 100);
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const memoryUsedMb = Math.round((totalMem - freeMem) / (1024 * 1024));
        const memoryTotalMb = Math.round(totalMem / (1024 * 1024));
        let diskUsedMb = 0;
        let diskTotalMb = 0;
        try {
            const stats = fs_1.default.statfsSync('.');
            diskTotalMb = Math.round((stats.bsize * stats.blocks) / (1024 * 1024));
            diskUsedMb = Math.round((stats.bsize * (stats.blocks - stats.bfree)) / (1024 * 1024));
        }
        catch {
            diskTotalMb = 0;
            diskUsedMb = 0;
        }
        const uptimeSeconds = Math.round(os_1.default.uptime());
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
    async handleSubscribeEvents(args) {
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
exports.DashboardToolHandler = DashboardToolHandler;
//# sourceMappingURL=dashboard.js.map