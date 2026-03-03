import { MaturityLevel, AgentSupport, ResolvedBehavior } from './types';
/**
 * Agent Behavior Resolver
 *
 * Determines agent behavior based on maturity level
 * and agent support mode.
 */
export declare class AgentBehaviorResolver {
    /**
     * Resolve the behavior for a given level and support mode
     */
    resolve(level: MaturityLevel, support: AgentSupport): ResolvedBehavior;
    /**
     * Get default behavior for unknown levels
     */
    private getDefaultBehavior;
    /**
     * Merge base behavior with support mode overrides
     */
    private mergeBehavior;
    /**
     * Reduce oversight level for autonomous agents
     */
    private reduceOversight;
    /**
     * Get behavior description for display
     */
    getBehaviorDescription(level: MaturityLevel, support: AgentSupport): string;
    /**
     * Get all possible behaviors for a level
     */
    getAllBehaviors(level: MaturityLevel): Record<AgentSupport, ResolvedBehavior>;
    /**
     * Determine if a specific action requires human approval
     */
    requiresApproval(level: MaturityLevel, support: AgentSupport, action: 'create' | 'modify' | 'delete' | 'deploy'): boolean;
}
/**
 * Create a new AgentBehaviorResolver instance
 */
export declare function createAgentBehaviorResolver(): AgentBehaviorResolver;
/**
 * Quick check: is autonomous operation allowed?
 */
export declare function isAutonomousAllowed(level: MaturityLevel, support: AgentSupport): boolean;
/**
 * Quick check: is auto-deploy allowed?
 */
export declare function isAutoDeployAllowed(level: MaturityLevel, support: AgentSupport): boolean;
//# sourceMappingURL=agent-behavior.d.ts.map