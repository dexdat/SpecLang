/**
 * Lock Client for agents
 *
 * Generated from: @speclang/mcp.tools.locks
 *
 * Provides a client interface for agents to acquire/release locks
 * with built-in deadlock prevention and retry logic.
 */
import { DeadlockConfig } from './deadlock';
import { Lock, AgentId } from './types';
export interface LockClientConfig {
    agentId: AgentId;
    locksDir?: string;
    timeout?: number;
    deadlockConfig?: Partial<DeadlockConfig>;
}
export interface LockHandle {
    filePath: string;
    lock: Lock;
    release: () => Promise<boolean>;
}
export declare class LockClient {
    private lockManager;
    private deadlockPreventer;
    private deadlockDetector;
    private agentId;
    private heldLocks;
    constructor(config: LockClientConfig);
    initialize(): Promise<void>;
    acquireLock(filePath: string): Promise<LockHandle | null>;
    acquireMultipleLocks(filePaths: string[]): Promise<Map<string, LockHandle | null>>;
    releaseLock(filePath: string): Promise<boolean>;
    releaseAllLocks(): Promise<boolean>;
    isLocked(filePath: string): Promise<boolean>;
    getLock(filePath: string): Promise<Lock | null>;
    getActiveLocks(): Promise<Lock[]>;
    generateLockToken(): string;
    getHeldLocks(): LockHandle[];
    cleanup(): Promise<void>;
    getAgentId(): AgentId;
    onDeadlockDetected(callback: (locks: Lock[]) => void): void;
}
export declare function createLockClient(config: LockClientConfig): LockClient;
//# sourceMappingURL=lock_client.d.ts.map