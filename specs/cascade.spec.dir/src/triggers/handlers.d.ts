import { Trigger, HandlerResult, CascadeState, AgentRegistry } from './types';
/**
 * Trigger handler interface
 */
export interface TriggerHandler {
    canHandle(trigger: Trigger): boolean;
    handle(trigger: Trigger): Promise<HandlerResult>;
}
/**
 * Cascade manager interface
 */
export interface CascadeManager {
    startCascade(trigger: Trigger): Promise<string>;
    getCascade(id: string): CascadeState | null;
    pauseCascade(id: string): Promise<void>;
    resumeCascade(id: string): Promise<void>;
    abortCascade(id: string): Promise<void>;
    isConverged(cascadeId: string): boolean;
    incrementDepth(cascadeId: string): boolean;
    markConverged(cascadeId: string): void;
}
/**
 * In-memory cascade manager for tracking cascade state
 */
export declare class InMemoryCascadeManager implements CascadeManager {
    private cascades;
    private readonly maxDepth;
    private readonly maxFiles;
    private readonly maxDurationMs;
    startCascade(trigger: Trigger): Promise<string>;
    getCascade(id: string): CascadeState | null;
    pauseCascade(id: string): Promise<void>;
    resumeCascade(id: string): Promise<void>;
    abortCascade(id: string): Promise<void>;
    isConverged(cascadeId: string): boolean;
    incrementDepth(cascadeId: string): boolean;
    markConverged(cascadeId: string): void;
}
/**
 * User edit handler - handles human or orchestrator edits
 */
export declare class UserEditHandler implements TriggerHandler {
    private cascadeManager;
    constructor(cascadeManager: CascadeManager);
    canHandle(trigger: Trigger): boolean;
    handle(trigger: Trigger): Promise<HandlerResult>;
}
/**
 * Agent write handler - handles agent file writes
 */
export declare class AgentWriteHandler implements TriggerHandler {
    private agentRegistry;
    private cascadeManager;
    constructor(agentRegistry: AgentRegistry, cascadeManager: CascadeManager);
    canHandle(trigger: Trigger): boolean;
    handle(trigger: Trigger): Promise<HandlerResult>;
    private invokeAgent;
}
/**
 * External handler - handles external changes (git pull, file sync)
 */
export declare class ExternalHandler implements TriggerHandler {
    private cascadeManager;
    constructor(cascadeManager: CascadeManager);
    canHandle(trigger: Trigger): boolean;
    handle(trigger: Trigger): Promise<HandlerResult>;
    private isSpecRelated;
}
/**
 * Create default handlers
 */
export declare function createHandlers(agentRegistry: AgentRegistry, cascadeManager: CascadeManager): TriggerHandler[];
//# sourceMappingURL=handlers.d.ts.map