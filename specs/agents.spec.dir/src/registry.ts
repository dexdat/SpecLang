/**
 * SPECLANG-GENERATED: Agent Registry
 * Source: @speclang/agent-protocol @block:registry/management
 * 
 * This module provides agent registry functionality for tracking and managing agents.
 */

import { EventEmitter } from 'events';
import type { Agent, AgentRole, AgentStatus, AgentEvent, AgentEventType } from './types';

/**
 * AgentRegistry - tracks and manages all agents in the system
 */
export class AgentRegistry extends EventEmitter {
  private agents: Map<string, Agent>;
  private roleIndex: Map<AgentRole, Set<string>>;

  constructor() {
    super();
    this.agents = new Map();
    this.roleIndex = new Map();
  }

  /**
   * Register an agent
   */
  register(agent: Agent): void {
    this.agents.set(agent.id, agent);
    
    // Index by role
    if (!this.roleIndex.has(agent.role)) {
      this.roleIndex.set(agent.role, new Set());
    }
    this.roleIndex.get(agent.role)!.add(agent.id);

    this.emitEvent('session-created', agent.id, { role: agent.role });
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

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
  get(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by role
   */
  getByRole(role: AgentRole): Agent[] {
    const roleSet = this.roleIndex.get(role);
    if (!roleSet) return [];
    
    return Array.from(roleSet)
      .map(id => this.agents.get(id))
      .filter((a): a is Agent => a !== undefined);
  }

  /**
   * Get agent by session ID
   */
  getBySessionId(sessionId: string): Agent | undefined {
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
  setStatus(agentId: string, status: AgentStatus): void {
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
  getByStatus(status: AgentStatus): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.status === status);
  }

  /**
   * Get active agents (not idle)
   */
  getActive(): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.status !== 'idle');
  }

  /**
   * Check if agent exists
   */
  has(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get count by role
   */
  countByRole(role: AgentRole): number {
    return this.roleIndex.get(role)?.size || 0;
  }

  /**
   * Get total count
   */
  count(): number {
    return this.agents.size;
  }

  /**
   * Clear all agents
   */
  clear(): void {
    this.agents.clear();
    this.roleIndex.clear();
  }

  /**
   * Emit an event
   */
  private emitEvent(type: AgentEventType, agentId: string, data?: unknown): void {
    const event: AgentEvent = {
      type,
      agent_id: agentId,
      data,
      timestamp: Date.now(),
    };
    this.emit(type, event);
  }
}

/**
 * Create a new agent registry
 */
export function createAgentRegistry(): AgentRegistry {
  return new AgentRegistry();
}
