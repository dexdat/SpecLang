/**
 * Deadlock Prevention for LockManager
 *
 * Generated from: @speclang/mcp.tools.locks
 *
 * Strategies:
 * - All locks have expiration timeouts
 * - Clients implement retry with exponential backoff
 * - Lock ordering: acquire locks in alphabetical file path order
 * - Deadlock detection via timeout; release locks on timeout
 */
import { LockManager } from './locks';
import { Lock, AgentId } from './types';
export interface DeadlockConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    orderingEnabled: boolean;
}
export interface LockResult {
    success: boolean;
    lock?: Lock;
    error?: string;
    attempts: number;
}
export declare class DeadlockPreventer {
    private lockManager;
    private config;
    constructor(lockManager: LockManager, config?: Partial<DeadlockConfig>);
    acquireWithRetry(filePath: string, agentId: AgentId, files?: string[]): Promise<LockResult>;
    acquireMultiple(filePaths: string[], agentId: AgentId): Promise<Map<string, LockResult>>;
    releaseMultiple(filePaths: string[], agentId: AgentId): Promise<boolean>;
    private sortFilePaths;
    private calculateBackoff;
    private sleep;
    setConfig(config: Partial<DeadlockConfig>): void;
    getConfig(): DeadlockConfig;
}
export declare class DeadlockDetector {
    private lockManager;
    private checkInterval;
    private listeners;
    constructor(lockManager: LockManager);
    start(intervalMs?: number): void;
    stop(): void;
    onDeadlockDetected(callback: (locks: Lock[]) => void): void;
    private checkAndNotify;
}
//# sourceMappingURL=deadlock.d.ts.map