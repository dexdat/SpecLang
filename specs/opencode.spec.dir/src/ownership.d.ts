import type { OpenCodeDatabase } from './types';
export interface FileLock {
    file_path: string;
    session_id: string;
    lock_token: string;
    acquired_at: number;
    expires_at: number;
}
export declare class OwnershipGuard {
    private db;
    private cleanupInterval;
    constructor(db: OpenCodeDatabase);
    private initSchema;
    private startCleanup;
    private cleanupExpiredLocks;
    private generateToken;
    ownsFile(sessionId: string, filePath: string): Promise<boolean>;
    acquireOwnership(sessionId: string, filePath: string): Promise<string>;
    releaseOwnership(sessionId: string, filePath?: string): Promise<void>;
    releaseAllForSession(sessionId: string): Promise<void>;
    getLockInfo(filePath: string): Promise<FileLock | undefined>;
    refreshLock(sessionId: string, filePath: string): Promise<boolean>;
    destroy(): void;
}
//# sourceMappingURL=ownership.d.ts.map