"use strict";
/**
 * SPECLANG-GENERATED: Agent Registry
 * Source: @speclang/agent-protocol @block:registry/management
 *
 * This module provides agent registry functionality for tracking and managing agents.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistry = void 0;
exports.createAgentRegistry = createAgentRegistry;
const events_1 = require("events");
/**
 * AgentRegistry - tracks and manages all agents in the system
 */
class AgentRegistry extends events_1.EventEmitter {
    agents;
    roleIndex;
    constructor() {
        super();
        this.agents = new Map();
        this.roleIndex = new Map();
    }
    /**
     * Register an agent
     */
    register(agent) {
        this.agents.set(agent.id, agent);
        // Index by role
        if (!this.roleIndex.has(agent.role)) {
            this.roleIndex.set(agent.role, new Set());
        }
        this.roleIndex.get(agent.role).add(agent.id);
        this.emitEvent('session-created', agent.id, { role: agent.role });
    }
    /**
     * Unregister an agent
     */
    unregister(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return;
        this.agents.delete(agentId);
        // Remove from role index
        const roleSet = this.roleIndex.get(agent.role);
        if (roleSet) {
            roleSet.delete(agentId);
        }
        this.emitEvent('session-ended', agentId, { role: agent.role });
    }
    /**
     * Get agent by ID
     */
    get(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get all agents
     */
    getAll() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agents by role
     */
    getByRole(role) {
        const roleSet = this.roleIndex.get(role);
        if (!roleSet)
            return [];
        return Array.from(roleSet)
            .map(id => this.agents.get(id))
            .filter((a) => a !== undefined);
    }
    /**
     * Get agent by session ID
     */
    getBySessionId(sessionId) {
        for (const agent of Array.from(this.agents.values())) {
            if (agent.session_id === sessionId) {
                return agent;
            }
        }
        return undefined;
    }
    /**
     * Update agent status
     */
    setStatus(agentId, status) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = status;
            agent.last_activity = new Date();
            this.emitEvent('ownership-changed', agentId, { status });
        }
    }
    /**
     * Get agents by status
     */
    getByStatus(status) {
        return Array.from(this.agents.values()).filter(a => a.status === status);
    }
    /**
     * Get active agents (not idle)
     */
    getActive() {
        return Array.from(this.agents.values()).filter(a => a.status !== 'idle');
    }
    /**
     * Check if agent exists
     */
    has(agentId) {
        return this.agents.has(agentId);
    }
    /**
     * Get count by role
     */
    countByRole(role) {
        return this.roleIndex.get(role)?.size || 0;
    }
    /**
     * Get total count
     */
    count() {
        return this.agents.size;
    }
    /**
     * Clear all agents
     */
    clear() {
        this.agents.clear();
        this.roleIndex.clear();
    }
    /**
     * Emit an event
     */
    emitEvent(type, agentId, data) {
        const event = {
            type,
            agent_id: agentId,
            data,
            timestamp: Date.now(),
        };
        this.emit(type, event);
    }
}
exports.AgentRegistry = AgentRegistry;
/**
 * Create a new agent registry
 */
function createAgentRegistry() {
    return new AgentRegistry();
}
//# sourceMappingURL=registry.js.map