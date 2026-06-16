/**
 * SPECLANG-GENERATED: Agent Registry
 * Source: @speclang/agent-protocol @block:registry/management
 *
 * This module provides agent registry functionality for tracking and managing agents.
 */
import { EventEmitter } from 'events';
import type { Agent, AgentRole, AgentStatus } from './types';
/**
 * AgentRegistry - tracks and manages all agents in the system
 */
export declare class AgentRegistry extends EventEmitter {
    private agents;
    private roleIndex;
    constructor();
    /**
     * Register an agent
     */
    register(agent: Agent): void;
    /**
     * Unregister an agent
     */
    unregister(agentId: string): void;
    /**
     * Get agent by ID
     */
    get(agentId: string): Agent | undefined;
    /**
     * Get all agents
     */
    getAll(): Agent[];
    /**
     * Get agents by role
     */
    getByRole(role: AgentRole): Agent[];
    /**
     * Get agent by session ID
     */
    getBySessionId(sessionId: string): Agent | undefined;
    /**
     * Update agent status
     */
    setStatus(agentId: string, status: AgentStatus): void;
    /**
     * Get agents by status
     */
    getByStatus(status: AgentStatus): Agent[];
    /**
     * Get active agents (not idle)
     */
    getActive(): Agent[];
    /**
     * Check if agent exists
     */
    has(agentId: string): boolean;
    /**
     * Get count by role
     */
    countByRole(role: AgentRole): number;
    /**
     * Get total count
     */
    count(): number;
    /**
     * Clear all agents
     */
    clear(): void;
    /**
     * Emit an event
     */
    private emitEvent;
}
/**
 * Create a new agent registry
 */
export declare function createAgentRegistry(): AgentRegistry;
//# sourceMappingURL=registry.d.ts.map