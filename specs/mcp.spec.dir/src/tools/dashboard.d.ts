/**
 * SPECLANG-GENERATED: MCP Dashboard/UI Tools
 * Source: @speclang/mcp-ui-tools
 */
import type { SpecLangDB } from '../../../sqlite.spec.dir/src/index.js';
import type { MCPServerConfig } from '../types.js';
/**
 * Dashboard tool handler for UI monitoring tools
 */
export declare class DashboardToolHandler {
    private db;
    private config;
    private statsCache;
    private cacheInterval;
    constructor(db: SpecLangDB, config?: MCPServerConfig);
    /**
     * Handle speclang_query_events - Query recent cascade events with filtering
     */
    handleQueryEvents(args: {
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
    }>;
    /**
     * Handle speclang_get_agent_statuses - Get detailed status for all agent sessions
     */
    handleGetAgentStatuses(args: {
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
    }>;
    /**
     * Handle speclang_get_project_stats - Get project statistics
     */
    handleGetProjectStats(): Promise<{
        specs_count: number;
        generated_files_count: number;
        test_files_count: number;
        total_files: number;
        cascade_active: boolean;
        cascade_depth: number | null;
        queue_depth: number;
    }>;
    /**
     * Handle speclang_get_queue_status - Get detailed queue status
     */
    handleGetQueueStatus(args: {
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
    }>;
    /**
     * Handle speclang_get_system_stats - Get system-level statistics
     */
    handleGetSystemStats(): Promise<{
        cpu_percent: number;
        memory_used_mb: number;
        memory_total_mb: number;
        disk_used_mb: number;
        disk_total_mb: number;
        uptime_seconds: number;
    }>;
    /**
     * Handle speclang_subscribe_events - Get SSE endpoint info for real-time updates
     */
    handleSubscribeEvents(args: {
        types?: string[];
    }): Promise<{
        endpoint: string;
        event_types: string[];
        connection_info: string;
    }>;
}
//# sourceMappingURL=dashboard.d.ts.map