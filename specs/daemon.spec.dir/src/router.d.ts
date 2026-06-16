/**
 * Event router for speclangd - Maps file changes to responsible agents
 *
 * Generated from: @speclang/daemon/routing
 */
import { EventEmitter } from 'events';
import { FileEvent, AgentTask, AgentId } from './types';
export declare class Router extends EventEmitter {
    private rules;
    private agentSessions;
    private cascadeDepth;
    constructor();
    /**
     * Initialize routing rules from spec
     */
    private initializeRules;
    /**
     * Route a file event to the responsible agent
     */
    route(event: FileEvent): AgentTask | null;
    /**
     * Extract spec path from file path
     */
    private extractSpecPath;
    /**
     * Extract target path from file path
     */
    private extractTargetPath;
    /**
     * Register an agent session
     */
    registerAgent(agentId: AgentId, session: AgentSession): void;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: AgentId): void;
    /**
     * Get current cascade depth
     */
    getCascadeDepth(): number;
    /**
     * Reset cascade depth
     */
    resetCascadeDepth(): void;
    /**
     * Get agent for a task
     */
    getAgentForTask(task: AgentTask): AgentId;
    private getCodeAgentForTarget;
}
export interface AgentSession {
    id: AgentId;
    status: 'idle' | 'busy' | 'error';
    currentTask?: AgentTask;
    notify(event: FileEvent, task: AgentTask): Promise<boolean>;
}
//# sourceMappingURL=router.d.ts.map