/**
 * MCP Tools for speclangd Enterprise
 *
 * Generated from: @speclang/mcp-daemon/architecture
 */
export interface MCPToolHandlers {
    onQueueStatus?: () => Promise<{
        pending: string[];
        in_progress: string[];
        completed: string[];
        depth: number;
    }>;
    onQueuePause?: () => Promise<{
        ok: boolean;
        paused_at: number;
    }>;
    onQueueResume?: () => Promise<{
        ok: boolean;
        resumed_at: number;
    }>;
    onWorktreeCreate?: (params: {
        name: string;
        base_commit?: string;
    }) => Promise<{
        path: string;
        ready: boolean;
    }>;
    onWorktreeTest?: (params: {
        worktree: string;
        filter?: string;
    }) => Promise<{
        test_id: string;
        status: string;
        results?: unknown;
    }>;
    onWorktreeDeploy?: (params: {
        worktree: string;
        target: string;
    }) => Promise<{
        deployment_id: string;
        status: string;
    }>;
    onAgentControl?: (params: {
        session: string;
        command: string;
    }) => Promise<{
        ok: boolean;
        new_status: string;
    }>;
}
export declare class MCPTools {
    private server;
    private handlers;
    constructor(handlers?: MCPToolHandlers);
    initialize(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=mcp_tools.d.ts.map