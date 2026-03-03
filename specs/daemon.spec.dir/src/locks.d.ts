/**
 * Lock Manager for speclangd
 *
 * Generated from: @speclang/daemon/architecture
 *
 * Prevents concurrent write conflicts between agents
 */
import { Lock, AgentId, FileEvent } from './types';
export declare class LockManager {
    private locksDir;
    private timeout;
    private locks;
    constructor(locksDir?: string, timeout?: number);
    initialize(): Promise<void>;
    private lockPath;
    acquire(filePath: string, agentId: AgentId): Promise<Lock | null>;
    release(filePath: string, agentId: AgentId): Promise<boolean>;
    forceRelease(filePath: string): Promise<boolean>;
    isLocked(filePath: string): Promise<boolean>;
    getLock(filePath: string): Promise<Lock | null>;
    private isExpired;
    private getFileHash;
    getActiveLocks(): Promise<Lock[]>;
    cleanup(): Promise<void>;
    setTimeout(timeout: number): void;
    getTimeout(): number;
    claimEvent(workerId: AgentId): Promise<FileEvent | null>;
    releaseEvent(eventPath: string, workerId: AgentId): Promise<boolean>;
    getClaimedEvents(workerId?: AgentId): Promise<FileEvent[]>;
}
//# sourceMappingURL=locks.d.ts.map