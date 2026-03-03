"use strict";
// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/levels.spec.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentBehaviorResolver = void 0;
exports.createAgentBehaviorResolver = createAgentBehaviorResolver;
exports.isAutonomousAllowed = isAutonomousAllowed;
exports.isAutoDeployAllowed = isAutoDeployAllowed;
const levels_1 = require("./levels");
/**
 * Agent Behavior Resolver
 *
 * Determines agent behavior based on maturity level
 * and agent support mode.
 */
class AgentBehaviorResolver {
    /**
     * Resolve the behavior for a given level and support mode
     */
    resolve(level, support) {
        const levelDef = (0, levels_1.getLevelDefinition)(level);
        if (!levelDef) {
            // Return safe defaults for unknown levels
            return this.getDefaultBehavior();
        }
        // Agent support can override level defaults
        const behavior = this.mergeBehavior(levelDef.agentBehavior, support);
        return {
            confirmSteps: behavior.mode === 'confirm_each_step',
            requireReview: ['major_changes', 'critical_only'].includes(behavior.humanOversight),
            maxCascadeDepth: behavior.cascadeDepth,
            allowAutoDeploy: behavior.autoDeploy && support === 'agent_autonomous',
            // Derived behaviors
            allowDirectCascade: behavior.cascadeDepth > 3 && support === 'agent_autonomous',
            requireHumanApproval: behavior.humanOversight !== 'emergencies',
            notifyOnChanges: levelDef.order < 4 // POC through Beta
        };
    }
    /**
     * Get default behavior for unknown levels
     */
    getDefaultBehavior() {
        return {
            confirmSteps: true,
            requireReview: true,
            maxCascadeDepth: 1,
            allowAutoDeploy: false,
            allowDirectCascade: false,
            requireHumanApproval: true,
            notifyOnChanges: true
        };
    }
    /**
     * Merge base behavior with support mode overrides
     */
    mergeBehavior(base, support) {
        // agent_autonomous can reduce oversight
        if (support === 'agent_autonomous') {
            return {
                ...base,
                humanOversight: this.reduceOversight(base.humanOversight)
            };
        }
        // human_only increases oversight
        if (support === 'human_only') {
            return {
                ...base,
                mode: 'confirm_each_step',
                humanOversight: 'always',
                autoDeploy: false
            };
        }
        // agent_assisted keeps level defaults
        return base;
    }
    /**
     * Reduce oversight level for autonomous agents
     */
    reduceOversight(oversight) {
        const reduction = {
            'always': 'major_changes',
            'major_changes': 'critical_only',
            'critical_only': 'emergencies',
            'emergencies': 'emergencies'
        };
        return reduction[oversight];
    }
    /**
     * Get behavior description for display
     */
    getBehaviorDescription(level, support) {
        const behavior = this.resolve(level, support);
        const parts = [];
        if (behavior.confirmSteps) {
            parts.push('Requires confirmation for each step');
        }
        else if (behavior.requireReview) {
            parts.push('Agent-assisted with human review');
        }
        else {
            parts.push('Fully autonomous operation');
        }
        if (behavior.allowAutoDeploy) {
            parts.push('Auto-deploy enabled');
        }
        if (behavior.allowDirectCascade) {
            parts.push('Direct cascade allowed');
        }
        return parts.join('. ');
    }
    /**
     * Get all possible behaviors for a level
     */
    getAllBehaviors(level) {
        return {
            human_only: this.resolve(level, 'human_only'),
            agent_assisted: this.resolve(level, 'agent_assisted'),
            agent_autonomous: this.resolve(level, 'agent_autonomous')
        };
    }
    /**
     * Determine if a specific action requires human approval
     */
    requiresApproval(level, support, action) {
        const behavior = this.resolve(level, support);
        if (!behavior.requireHumanApproval) {
            return false;
        }
        // Certain actions always require approval at lower levels
        if (level === 'POC') {
            return true;
        }
        if (level === 'MVP' || level === 'Alpha') {
            return action === 'delete' || action === 'deploy';
        }
        if (level === 'Beta') {
            return action === 'delete';
        }
        // Production and above: only delete requires approval
        return action === 'delete';
    }
}
exports.AgentBehaviorResolver = AgentBehaviorResolver;
/**
 * Create a new AgentBehaviorResolver instance
 */
function createAgentBehaviorResolver() {
    return new AgentBehaviorResolver();
}
/**
 * Quick check: is autonomous operation allowed?
 */
function isAutonomousAllowed(level, support) {
    const resolver = new AgentBehaviorResolver();
    const behavior = resolver.resolve(level, support);
    return !behavior.confirmSteps;
}
/**
 * Quick check: is auto-deploy allowed?
 */
function isAutoDeployAllowed(level, support) {
    const resolver = new AgentBehaviorResolver();
    const behavior = resolver.resolve(level, support);
    return behavior.allowAutoDeploy;
}
//# sourceMappingURL=agent-behavior.js.map