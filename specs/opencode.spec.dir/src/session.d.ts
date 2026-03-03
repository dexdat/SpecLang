import type { OpenCodeDatabase } from './types';
export interface Session {
    id: string;
    agent: string;
    status: 'active' | 'idle' | 'done' | 'error';
    current_file: string | null;
    owns: string[];
    created_at: number;
    last_active: number;
}
export declare class SessionManager {
    private db;
    private currentSessionId;
    private cleanupInterval;
    constructor(db: OpenCodeDatabase);
    private initSchema;
    private startCleanup;
    private cleanupStaleSessions;
    private generateId;
    createSession(agent: string): string;
    setCurrentSession(sessionId: string): void;
    getCurrentSession(): string | null;
    getSession(sessionId: string): Promise<Session | undefined>;
    updateActivity(sessionId: string): void;
    updateStatus(sessionId: string, status: Session['status']): void;
    setCurrentFile(sessionId: string, filePath: string | null): void;
    addOwnedFile(sessionId: string, filePath: string): Promise<void>;
    removeOwnedFile(sessionId: string, filePath: string): Promise<void>;
    getSessionByAgent(agent: string): Promise<Session | undefined>;
    getActiveSessions(): Promise<Session[]>;
    allIdle(): Promise<boolean>;
    destroy(): void;
}
//# sourceMappingURL=session.d.ts.map