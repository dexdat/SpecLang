/**
speclang-header lines:5
id: @specs/maturity
version: 1.0.0
layer: 5
 */

// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/levels.spec.md

import { 
  MaturityLevel, 
  AgentSupport, 
  AgentBehavior, 
  HumanOversight,
  ResolvedBehavior 
} from './types';
import { getLevelDefinition } from './levels';

/**
 * Agent Behavior Resolver
 * 
 * Determines agent behavior based on maturity level
 * and agent support mode.
 */

export class AgentBehaviorResolver {
  /**
   * Resolve the behavior for a given level and support mode
   */
  resolve(level: MaturityLevel, support: AgentSupport): ResolvedBehavior {
    const levelDef = getLevelDefinition(level);
    
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
  private getDefaultBehavior(): ResolvedBehavior {
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
  private mergeBehavior(base: AgentBehavior, support: AgentSupport): AgentBehavior {
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
  private reduceOversight(oversight: HumanOversight): HumanOversight {
    const reduction: Record<HumanOversight, HumanOversight> = {
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
  getBehaviorDescription(level: MaturityLevel, support: AgentSupport): string {
    const behavior = this.resolve(level, support);
    const parts: string[] = [];
    
    if (behavior.confirmSteps) {
      parts.push('Requires confirmation for each step');
    } else if (behavior.requireReview) {
      parts.push('Agent-assisted with human review');
    } else {
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
  getAllBehaviors(level: MaturityLevel): Record<AgentSupport, ResolvedBehavior> {
    return {
      human_only: this.resolve(level, 'human_only'),
      agent_assisted: this.resolve(level, 'agent_assisted'),
      agent_autonomous: this.resolve(level, 'agent_autonomous')
    };
  }
  
  /**
   * Determine if a specific action requires human approval
   */
  requiresApproval(
    level: MaturityLevel, 
    support: AgentSupport, 
    action: 'create' | 'modify' | 'delete' | 'deploy'
  ): boolean {
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

/**
 * Create a new AgentBehaviorResolver instance
 */
export function createAgentBehaviorResolver(): AgentBehaviorResolver {
  return new AgentBehaviorResolver();
}

/**
 * Quick check: is autonomous operation allowed?
 */
export function isAutonomousAllowed(level: MaturityLevel, support: AgentSupport): boolean {
  const resolver = new AgentBehaviorResolver();
  const behavior = resolver.resolve(level, support);
  return !behavior.confirmSteps;
}

/**
 * Quick check: is auto-deploy allowed?
 */
export function isAutoDeployAllowed(level: MaturityLevel, support: AgentSupport): boolean {
  const resolver = new AgentBehaviorResolver();
  const behavior = resolver.resolve(level, support);
  return behavior.allowAutoDeploy;
}
