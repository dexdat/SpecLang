// SPECLANG-GENERATED: @speclang/cascade/triggers
// Trigger handlers - process different types of triggers

import { 
  Trigger, 
  HandlerResult, 
  CascadeState,
  AgentRegistry 
} from './types';
import { TriggerRouter } from './router';
import { getTriggerSourceType } from './sources';

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
export class InMemoryCascadeManager implements CascadeManager {
  private cascades: Map<string, CascadeState> = new Map();
  private readonly maxDepth = 100;
  private readonly maxFiles = 1000;
  private readonly maxDurationMs = 10 * 60 * 1000; // 10 minutes
  
  async startCascade(trigger: Trigger): Promise<string> {
    const cascadeId = `cascade-${Date.now().toString(36)}`;
    
    const state: CascadeState = {
      id: cascadeId,
      depth: 0,
      started_at: new Date(),
      last_activity: new Date(),
      max_depth: this.maxDepth,
      max_files: this.maxFiles,
      max_duration_ms: this.maxDurationMs,
      status: 'running'
    };
    
    this.cascades.set(cascadeId, state);
    return cascadeId;
  }
  
  getCascade(id: string): CascadeState | null {
    return this.cascades.get(id) || null;
  }
  
  async pauseCascade(id: string): Promise<void> {
    const state = this.cascades.get(id);
    if (state) {
      state.status = 'paused';
    }
  }
  
  async resumeCascade(id: string): Promise<void> {
    const state = this.cascades.get(id);
    if (state) {
      state.status = 'running';
      state.last_activity = new Date();
    }
  }
  
  async abortCascade(id: string): Promise<void> {
    const state = this.cascades.get(id);
    if (state) {
      state.status = 'aborted';
    }
  }
  
  isConverged(cascadeId: string): boolean {
    const state = this.cascades.get(cascadeId);
    return state?.status === 'converged';
  }
  
  incrementDepth(cascadeId: string): boolean {
    const state = this.cascades.get(cascadeId);
    if (!state) return false;
    
    state.depth++;
    state.last_activity = new Date();
    
    // Check limits
    if (state.depth >= state.max_depth) {
      state.status = 'paused';
      return false;
    }
    
    return true;
  }
  
  markConverged(cascadeId: string): void {
    const state = this.cascades.get(cascadeId);
    if (state) {
      state.status = 'converged';
    }
  }
}

/**
 * User edit handler - handles human or orchestrator edits
 */
export class UserEditHandler implements TriggerHandler {
  private cascadeManager: CascadeManager;
  
  constructor(cascadeManager: CascadeManager) {
    this.cascadeManager = cascadeManager;
  }
  
  canHandle(trigger: Trigger): boolean {
    return trigger.source === 'user_edit';
  }
  
  async handle(trigger: Trigger): Promise<HandlerResult> {
    // User edits always start a cascade
    const cascadeId = await this.cascadeManager.startCascade(trigger);
    
    trigger.cascade_id = cascadeId;
    
    return {
      handled: true,
      cascadeStarted: cascadeId,
      agentsInvoked: ['speclang-spec-writer']
    };
  }
}

/**
 * Agent write handler - handles agent file writes
 */
export class AgentWriteHandler implements TriggerHandler {
  private agentRegistry: AgentRegistry;
  private cascadeManager: CascadeManager;
  
  constructor(agentRegistry: AgentRegistry, cascadeManager: CascadeManager) {
    this.agentRegistry = agentRegistry;
    this.cascadeManager = cascadeManager;
  }
  
  canHandle(trigger: Trigger): boolean {
    return trigger.source === 'agent_write';
  }
  
  async handle(trigger: Trigger): Promise<HandlerResult> {
    // Route to downstream agents
    const registry = this.agentRegistry;
    const router = new TriggerRouter(registry);
    const routing = router.route(trigger);
    
    if (routing.agents.length === 0) {
      return { handled: false };
    }
    
    // Increment cascade depth if this is part of a cascade
    if (trigger.cascade_id) {
      const canContinue = this.cascadeManager.incrementDepth(trigger.cascade_id);
      if (!canContinue) {
        return {
          handled: false,
          error: 'Cascade max depth reached'
        };
      }
    }
    
    // Invoke agents
    for (const agent of routing.agents) {
      await this.invokeAgent(agent, trigger);
    }
    
    return {
      handled: true,
      agentsInvoked: routing.agents
    };
  }
  
  private async invokeAgent(agent: string, trigger: Trigger): Promise<void> {
    // In a real implementation, this would invoke the agent via IPC
    // For now, we just log the invocation
    console.log(`[Cascade] Invoking agent: ${agent} for trigger: ${trigger.file}`);
  }
}

/**
 * External handler - handles external changes (git pull, file sync)
 */
export class ExternalHandler implements TriggerHandler {
  private cascadeManager: CascadeManager;
  
  constructor(cascadeManager: CascadeManager) {
    this.cascadeManager = cascadeManager;
  }
  
  canHandle(trigger: Trigger): boolean {
    return trigger.source === 'external';
  }
  
  async handle(trigger: Trigger): Promise<HandlerResult> {
    // Check if this is a spec-related change
    if (!this.isSpecRelated(trigger.file)) {
      return { handled: false };
    }
    
    // Treat as user edit - start a cascade
    const cascadeId = await this.cascadeManager.startCascade(trigger);
    
    return {
      handled: true,
      cascadeStarted: cascadeId,
      agentsInvoked: ['speclang-spec-writer']
    };
  }
  
  private isSpecRelated(filePath: string): boolean {
    return (
      filePath.startsWith('specs/') || 
      filePath === 'project.scl' ||
      filePath.includes('/specs/')
    );
  }
}

/**
 * Create default handlers
 */
export function createHandlers(
  agentRegistry: AgentRegistry,
  cascadeManager: CascadeManager
): TriggerHandler[] {
  return [
    new UserEditHandler(cascadeManager),
    new AgentWriteHandler(agentRegistry, cascadeManager),
    new ExternalHandler(cascadeManager)
  ];
}
