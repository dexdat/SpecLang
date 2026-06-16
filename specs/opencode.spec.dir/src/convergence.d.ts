import type { OpenCodeDatabase, OpenCodePluginConfig } from './types';
import type { SessionManager } from './session';
export interface CascadeStatus {
    status: 'cascading' | 'converged' | 'finalizing';
    started: number;
    ended?: number;
    filesChanged: number;
    testResults?: TestResults;
    commitHash?: string;
}
export interface TestResults {
    passed: number;
    failed: number;
    duration: number;
}
export declare class ConvergenceDetector {
    private db;
    private config;
    private sessionManager;
    private lastEditTime;
    private convergenceTimer;
    private cascadeStatus;
    private onNotify?;
    constructor(db: OpenCodeDatabase, config: OpenCodePluginConfig, sessionManager: SessionManager, onNotify?: (message: string) => void);
    private initSchema;
    private startNewCascade;
    recordFileEdit(filePath: string): void;
    getCascadeStatus(): CascadeStatus | null;
    isCascading(): boolean;
    private scheduleConvergenceCheck;
    checkAndTrigger(): Promise<boolean>;
    finalize(): Promise<CascadeStatus | null>;
    waitForInflightEvents(): Promise<void>;
    verifyAgentsIdle(): Promise<boolean>;
    runTests(): Promise<TestResults>;
    private readTestResults;
    commitChanges(): Promise<string | null>;
    private notifyUser;
    private finalizeCascade;
    runPipeline(): Promise<void>;
    getLastEditTime(): number;
    isQuiet(): boolean;
    destroy(): void;
}
//# sourceMappingURL=convergence.d.ts.map