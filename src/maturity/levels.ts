// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/levels.spec.md

import { LevelDefinition, MaturityLevel } from './types';

/**
 * Maturity Level Definitions
 * 
 * Complete definitions for each project maturity level
 * with criteria, agent behavior, and required fields.
 */

export const MATURITY_LEVELS: LevelDefinition[] = [
  {
    name: 'POC',
    order: 0,
    description: 'Experimental, minimal validation',
    criteria: {
      documentation: 'sparse',
      testing: 'minimal',
      deployment: 'none',
      stability: 'experimental'
    },
    agentBehavior: {
      mode: 'confirm_each_step',
      humanOversight: 'always',
      cascadeDepth: 1,
      autoDeploy: false
    },
    requiredFields: ['id', 'version'],
    recommendedTests: []
  },
  
  {
    name: 'MVP',
    order: 1,
    description: 'Core functionality validated',
    criteria: {
      documentation: 'usable',
      testing: 'basic',
      deployment: 'internal',
      stability: 'changing'
    },
    agentBehavior: {
      mode: 'assisted_with_review',
      humanOversight: 'major_changes',
      cascadeDepth: 2,
      autoDeploy: false
    },
    requiredFields: ['id', 'version', 'tags', 'short'],
    recommendedTests: ['unit']
  },
  
  {
    name: 'Alpha',
    order: 2,
    description: 'Internal testing, incomplete features',
    criteria: {
      documentation: 'improving',
      testing: 'growing',
      deployment: 'internal',
      stability: 'changing'
    },
    agentBehavior: {
      mode: 'assisted_with_review',
      humanOversight: 'major_changes',
      cascadeDepth: 3,
      autoDeploy: false
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status'],
    recommendedTests: ['unit', 'integration']
  },
  
  {
    name: 'Beta',
    order: 3,
    description: 'External testing, feature complete',
    criteria: {
      documentation: 'complete',
      testing: 'comprehensive',
      deployment: 'beta',
      stability: 'stable'
    },
    agentBehavior: {
      mode: 'autonomous_non_critical',
      humanOversight: 'critical_only',
      cascadeDepth: 5,
      autoDeploy: false
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level'],
    recommendedTests: ['unit', 'integration', 'e2e']
  },
  
  {
    name: 'Production',
    order: 4,
    description: 'Production-ready, supported',
    criteria: {
      documentation: 'complete',
      testing: 'full',
      deployment: 'production',
      stability: 'hardened'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'emergencies',
      cascadeDepth: 10,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'agent_support'],
    recommendedTests: ['unit', 'integration', 'e2e', 'performance']
  },
  
  // Scale tiers
  {
    name: 'Startup',
    order: 5,
    description: 'Small team, rapid iteration',
    criteria: {
      documentation: 'complete',
      testing: 'comprehensive',
      deployment: 'production',
      stability: 'stable'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'critical_only',
      cascadeDepth: 7,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level'],
    recommendedTests: ['unit', 'integration']
  },
  
  {
    name: 'SMB',
    order: 6,
    description: 'Established processes, moderate scale',
    criteria: {
      documentation: 'complete',
      testing: 'full',
      deployment: 'production',
      stability: 'hardened'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'critical_only',
      cascadeDepth: 8,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'compliance'],
    recommendedTests: ['unit', 'integration', 'e2e', 'security']
  },
  
  {
    name: 'MSB',
    order: 7,
    description: 'Complex integration, compliance focus',
    criteria: {
      documentation: 'complete',
      testing: 'full',
      deployment: 'production',
      stability: 'hardened'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'critical_only',
      cascadeDepth: 10,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'compliance', 'audit'],
    recommendedTests: ['unit', 'integration', 'e2e', 'security', 'compliance']
  },
  
  {
    name: 'Enterprise',
    order: 8,
    description: 'Maximum scale, strict governance',
    criteria: {
      documentation: 'complete',
      testing: 'full',
      deployment: 'production',
      stability: 'hardened'
    },
    agentBehavior: {
      mode: 'fully_autonomous',
      humanOversight: 'emergencies',
      cascadeDepth: 10,
      autoDeploy: true
    },
    requiredFields: ['id', 'version', 'layer', 'tags', 'short', 'status', 'project_level', 'compliance', 'audit', 'governance'],
    recommendedTests: ['unit', 'integration', 'e2e', 'security', 'compliance', 'performance', 'chaos']
  }
];

/**
 * Get level definition by name
 */
export function getLevelDefinition(level: MaturityLevel): LevelDefinition | undefined {
  return MATURITY_LEVELS.find(l => l.name === level);
}

/**
 * Get level order (0 = least mature)
 */
export function getLevelOrder(level: MaturityLevel): number {
  const definition = getLevelDefinition(level);
  return definition?.order ?? 0;
}

/**
 * Get all level names
 */
export function getAllLevels(): MaturityLevel[] {
  return MATURITY_LEVELS.map(l => l.name);
}

/**
 * Get level by order
 */
export function getLevelByOrder(order: number): LevelDefinition | undefined {
  return MATURITY_LEVELS.find(l => l.order === order);
}

/**
 * Check if transition is valid (must be adjacent levels, forward only)
 */
export function isValidTransition(from: MaturityLevel, to: MaturityLevel): boolean {
  const fromOrder = getLevelOrder(from);
  const toOrder = getLevelOrder(to);
  // Must be exactly 1 level forward
  return toOrder - fromOrder === 1;
}

/**
 * Get next level in the hierarchy
 */
export function getNextLevel(current: MaturityLevel): MaturityLevel | null {
  const currentOrder = getLevelOrder(current);
  const nextLevel = getLevelByOrder(currentOrder + 1);
  return nextLevel?.name ?? null;
}

/**
 * Get previous level in the hierarchy
 */
export function getPreviousLevel(current: MaturityLevel): MaturityLevel | null {
  const currentOrder = getLevelOrder(current);
  const prevLevel = getLevelByOrder(currentOrder - 1);
  return prevLevel?.name ?? null;
}
