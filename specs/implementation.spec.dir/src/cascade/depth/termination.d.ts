import { ConvergenceStatus } from './types.js';
import { DepthState } from './types.js';
export type TerminationType = 'normal' | 'forced';
export interface TerminationConditions {
    normal: TerminationCondition[];
    forced: TerminationCondition[];
    onTerminate: TerminationAction[];
}
export interface TerminationCondition {
    name: string;
    check: () => boolean;
}
export interface TerminationAction {
    name: string;
    execute: () => Promise<void> | void;
}
export interface TerminationResult {
    shouldTerminate: boolean;
    type: TerminationType;
    reason: string;
    conditions: string[];
}
export declare class CascadeTerminator {
    private conditions;
    private pendingActions;
    constructor();
    addNormalCondition(name: string, check: () => boolean): void;
    addForcedCondition(name: string, check: () => boolean): void;
    addTerminateAction(name: string, action: () => Promise<void> | void): void;
    checkTermination(convergenceStatus: ConvergenceStatus, depthState: DepthState | null, agentsIdle?: boolean, pendingEvents?: number): TerminationResult;
    private isDepthStable;
    executeTermination(): Promise<void>;
    getPendingActions(): string[];
    hasPendingAction(name: string): boolean;
    clearPendingActions(): void;
    static createDefault(): CascadeTerminator;
}
//# sourceMappingURL=termination.d.ts.map