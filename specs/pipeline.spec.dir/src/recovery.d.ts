/**
 * Recovery System for Pipeline
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/recovery
 */
import { RecoveryAction, RecoveryContext, RecoveryResult } from './types';
export declare class RecoveryExecutor {
    private errorLogDir;
    private verbose;
    constructor(errorLogDir?: string, verbose?: boolean);
    execute(action: RecoveryAction, context: RecoveryContext): Promise<{
        success: boolean;
        error?: string;
    }>;
    executeAll(actions: RecoveryAction[], context: RecoveryContext): Promise<RecoveryResult>;
    private rollback;
    private notify;
    private retry;
    private pause;
    private formatNotificationMessage;
    private writeNotificationMessage;
    private generateSuggestions;
    private logError;
}
export declare const RecoveryActions: {
    rollbackLastSpecChange(): RecoveryAction;
    notifyOrchestrator(message?: string): RecoveryAction;
    retryPipeline(): RecoveryAction;
    pauseAndWait(duration: number, reason?: string): RecoveryAction;
};
//# sourceMappingURL=recovery.d.ts.map