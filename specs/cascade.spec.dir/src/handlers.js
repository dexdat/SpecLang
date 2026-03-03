"use strict";
// SPECLANG-GENERATED: @speclang/cascade/triggers
// Trigger handlers - process different types of triggers
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalHandler = exports.AgentWriteHandler = exports.UserEditHandler = exports.InMemoryCascadeManager = void 0;
exports.createHandlers = createHandlers;
const router_1 = require("./router");
/**
 * In-memory cascade manager for tracking cascade state
 */
class InMemoryCascadeManager {
    cascades = new Map();
    maxDepth = 100;
    maxFiles = 1000;
    maxDurationMs = 10 * 60 * 1000; // 10 minutes
    async startCascade(trigger) {
        const cascadeId = `cascade-${Date.now().toString(36)}`;
        const state = {
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
    getCascade(id) {
        return this.cascades.get(id) || null;
    }
    async pauseCascade(id) {
        const state = this.cascades.get(id);
        if (state) {
            state.status = 'paused';
        }
    }
    async resumeCascade(id) {
        const state = this.cascades.get(id);
        if (state) {
            state.status = 'running';
            state.last_activity = new Date();
        }
    }
    async abortCascade(id) {
        const state = this.cascades.get(id);
        if (state) {
            state.status = 'aborted';
        }
    }
    isConverged(cascadeId) {
        const state = this.cascades.get(cascadeId);
        return state?.status === 'converged';
    }
    incrementDepth(cascadeId) {
        const state = this.cascades.get(cascadeId);
        if (!state)
            return false;
        state.depth++;
        state.last_activity = new Date();
        // Check limits
        if (state.depth >= state.max_depth) {
            state.status = 'paused';
            return false;
        }
        return true;
    }
    markConverged(cascadeId) {
        const state = this.cascades.get(cascadeId);
        if (state) {
            state.status = 'converged';
        }
    }
}
exports.InMemoryCascadeManager = InMemoryCascadeManager;
/**
 * User edit handler - handles human or orchestrator edits
 */
class UserEditHandler {
    cascadeManager;
    constructor(cascadeManager) {
        this.cascadeManager = cascadeManager;
    }
    canHandle(trigger) {
        return trigger.source === 'user_edit';
    }
    async handle(trigger) {
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
exports.UserEditHandler = UserEditHandler;
/**
 * Agent write handler - handles agent file writes
 */
class AgentWriteHandler {
    agentRegistry;
    cascadeManager;
    constructor(agentRegistry, cascadeManager) {
        this.agentRegistry = agentRegistry;
        this.cascadeManager = cascadeManager;
    }
    canHandle(trigger) {
        return trigger.source === 'agent_write';
    }
    async handle(trigger) {
        // Route to downstream agents
        const registry = this.agentRegistry;
        const router = new router_1.TriggerRouter(registry);
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
    async invokeAgent(agent, trigger) {
        // In a real implementation, this would invoke the agent via IPC
        // For now, we just log the invocation
        console.log(`[Cascade] Invoking agent: ${agent} for trigger: ${trigger.file}`);
    }
}
exports.AgentWriteHandler = AgentWriteHandler;
/**
 * External handler - handles external changes (git pull, file sync)
 */
class ExternalHandler {
    cascadeManager;
    constructor(cascadeManager) {
        this.cascadeManager = cascadeManager;
    }
    canHandle(trigger) {
        return trigger.source === 'external';
    }
    async handle(trigger) {
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
    isSpecRelated(filePath) {
        return (filePath.startsWith('specs/') ||
            filePath === 'project.scl' ||
            filePath.includes('/specs/'));
    }
}
exports.ExternalHandler = ExternalHandler;
/**
 * Create default handlers
 */
function createHandlers(agentRegistry, cascadeManager) {
    return [
        new UserEditHandler(cascadeManager),
        new AgentWriteHandler(agentRegistry, cascadeManager),
        new ExternalHandler(cascadeManager)
    ];
}
//# sourceMappingURL=handlers.js.map