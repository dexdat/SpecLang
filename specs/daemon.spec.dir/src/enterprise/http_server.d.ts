/**
 * Enterprise HTTP Server with SSE for speclangd
 *
 * Generated from: @speclang/mcp-daemon/architecture
 */
export interface QueueItem {
    id: string;
    file: string;
    state: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: 'high' | 'normal' | 'low';
    addedAt: number;
    startedAt?: number;
    completedAt?: number;
    error?: string;
}
export interface DaemonStatusResponse {
    mode: string;
    queue_depth: number;
    files_watching: number;
    uptime: number;
}
export interface QueueResponse {
    pending: string[];
    in_progress: string[];
    completed: string[];
}
export interface CommandRequest {
    command: 'pause' | 'resume' | 'priority' | 'worktree';
    params?: Record<string, unknown>;
}
export interface WorktreeInfo {
    name: string;
    path: string;
    base_commit?: string;
    ready: boolean;
    created_at: number;
}
export interface TestResult {
    test_id: string;
    status: 'running' | 'passed' | 'failed';
    passed?: number;
    failed?: number;
    duration?: number;
}
export type SSEEventType = 'file.changed' | 'queue.updated' | 'agent.started' | 'agent.finished' | 'convergence.detected' | 'pipeline.started' | 'pipeline.finished';
export interface SSEEvent {
    event: SSEEventType;
    data: Record<string, unknown>;
}
export declare class HTTPServer {
    private app;
    private server;
    private port;
    private host;
    private eventEmitter;
    private queue;
    private worktrees;
    private startTime;
    private filesWatching;
    private paused;
    constructor(port?: number, host?: string);
    private setupRoutes;
    private broadcastQueueUpdate;
    emit(event: SSEEventType, data: Record<string, unknown>): void;
    addToQueue(file: string, priority?: 'high' | 'normal' | 'low'): void;
    setFilesWatching(count: number): void;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=http_server.d.ts.map