/**
 * SPECLANG-GENERATED: MCP Server SSE Streaming
 * Source: @speclang/mcp
 */
import type { SpecLangDB } from '../../sqlite.spec.dir/src/index.js';
import type { SSEEventType, MCPSSEConfig, FileChangeEventData, CascadeProgressEventData, AgentActivityEventData, ConvergenceEventData, CommandEventData } from './types.js';
/**
 * SSE Manager for real-time event streaming
 */
export declare class SSEManager {
    private clients;
    private db;
    private config;
    private pollInterval;
    private lastPollTime;
    constructor(db: SpecLangDB | null, config: MCPSSEConfig);
    /**
     * Start SSE polling
     */
    start(): void;
    /**
     * Stop SSE polling
     */
    stop(): void;
    /**
     * Add a new SSE client
     */
    addClient(id: string, res: SSEResponse): void;
    /**
     * Remove a client
     */
    removeClient(id: string): void;
    /**
     * Broadcast event to all clients
     */
    broadcast(type: SSEEventType, data: Record<string, unknown>): void;
    /**
     * Broadcast file change event
     */
    broadcastFileChange(data: FileChangeEventData): void;
    /**
     * Broadcast cascade progress event
     */
    broadcastCascadeProgress(data: CascadeProgressEventData): void;
    /**
     * Broadcast agent activity event
     */
    broadcastAgentActivity(data: AgentActivityEventData): void;
    /**
     * Broadcast convergence event
     */
    broadcastConvergence(data: ConvergenceEventData): void;
    broadcastCommand(data: CommandEventData): void;
    /**
     * Get client count
     */
    getClientCount(): number;
    /**
     * Poll database for changes
     */
    private pollChanges;
    /**
     * Create Express handler for /events endpoint
     */
    expressHandler(): (req: SSEExpressRequest, res: SSEExpressResponse) => void;
}
interface SSEResponse {
    writeHead(status: number, headers: Record<string, string>): void;
    write(data: string): void;
    on(event: 'close', callback: () => void): void;
}
interface SSEExpressRequest {
    on(event: 'close', callback: () => void): void;
}
interface SSEExpressResponse {
    writeHead(status: number, headers: Record<string, string>): void;
    write(data: string): void;
    on(event: 'close', callback: () => void): void;
}
/**
 * Create SSE manager instance
 */
export declare function createSSEManager(db: SpecLangDB | null, config: MCPSSEConfig): SSEManager;
export {};
//# sourceMappingURL=sse.d.ts.map