# speclang-header lines:13
id: "@specs/agent-behavior/behavior-matrix"
version: 1.0.0
layer: 5
project_level: Alpha
agent_support: agent_autonomous
tags: [agent, behavior, matrix, implementation]
short: Agent behavior matrix implementation
target: src/agent-behavior/behavior-matrix.ts
depends_on:
  - "@speclang/project-maturity-levels"
  - "@speclang/agent-support-levels"
  - "@speclang/agent-behavior-matrix"
---

# Agent Behavior Matrix Implementation

Implementation of the agent behavior matrix defined in `@ref:specs/agent-behavior-matrix`.

## @block:types @kind:interface

```typescript
/**
 * Project maturity levels
 */
export type ProjectLevel = 'POC' | 'MVP' | 'Alpha' | 'Beta' | 'Production' | 'Startup' | 'Enterprise';

/**
 * Agent support levels
 */
export type AgentSupportLevel = 'human_only' | 'agent_assisted' | 'agent_autonomous';

/**
 * Agent roles in the system
 */
export type AgentRole = 'spec-writer' | 'code-gen' | 'test-writer' | 'orchestrator';

/**
 * Behavior permissions for an agent
 */
export interface BehaviorPermissions {
  canWrite: boolean;
  canCommit: boolean;
  canGenerateCode: boolean;
  canRunTests: boolean;
  canAutoSplit: boolean;
  requiresApproval: boolean;
  requiresReview: boolean;
  humanInvolvement: 'none' | 'monitoring' | 'review' | 'approval' | 'full';
}

/**
 * Agent behavior configuration
 */
export interface AgentBehaviorConfig {
  projectLevel: ProjectLevel;
  agentSupport: AgentSupportLevel;
  role: AgentRole;
  layer: number;
}

/**
 * Behavior matrix entry
 */
export interface BehaviorMatrixEntry {
  permissions: BehaviorPermissions;
  resourceBudget: 'minimal' | 'basic' | 'moderate' | 'substantial' | 'full' | 'maximum';
  fallbackLevel: AgentSupportLevel;
}
```

## @block:getBehavior @kind:function

```typescript
/**
 * Get behavior permissions based on project level, agent support, and role
 */
export function getBehaviorPermissions(
  projectLevel: ProjectLevel,
  agentSupport: AgentSupportLevel,
  role: AgentRole
): BehaviorPermissions {
  // Human-only always has read-only access
  if (agentSupport === 'human_only') {
    return {
      canWrite: false,
      canCommit: false,
      canGenerateCode: false,
      canRunTests: false,
      canAutoSplit: false,
      requiresApproval: true,
      requiresReview: true,
      humanInvolvement: 'full',
    };
  }

  // Agent-assisted requires approval for most actions
  if (agentSupport === 'agent_assisted') {
    return getAgentAssistedPermissions(projectLevel, role);
  }

  // Agent autonomous has full permissions
  return getAgentAutonomousPermissions(projectLevel, role);
}
```

## @block:getAgentAssistedPermissions @kind:function

```typescript
function getAgentAssistedPermissions(
  projectLevel: ProjectLevel,
  role: AgentRole
): BehaviorPermissions {
  switch (projectLevel) {
    case 'POC':
      return {
        canWrite: false,
        canCommit: false,
        canGenerateCode: false,
        canRunTests: false,
        canAutoSplit: false,
        requiresApproval: true,
        requiresReview: true,
        humanInvolvement: 'full',
      };

    case 'MVP':
      return {
        canWrite: true,
        canCommit: false,
        canGenerateCode: true,
        canRunTests: false,
        canAutoSplit: false,
        requiresApproval: true,
        requiresReview: true,
        humanInvolvement: 'approval',
      };

    case 'Alpha':
    case 'Startup':
      return {
        canWrite: true,
        canCommit: true,
        canGenerateCode: true,
        canRunTests: true,
        canAutoSplit: true,
        requiresApproval: true,
        requiresReview: true,
        humanInvolvement: 'review',
      };

    case 'Beta':
      return {
        canWrite: true,
        canCommit: true,
        canGenerateCode: true,
        canRunTests: true,
        canAutoSplit: true,
        requiresApproval: false,
        requiresReview: true,
        humanInvolvement: 'monitoring',
      };

    case 'Production':
    case 'Enterprise':
      return {
        canWrite: true,
        canCommit: true,
        canGenerateCode: true,
        canRunTests: true,
        canAutoSplit: true,
        requiresApproval: false,
        requiresReview: false,
        humanInvolvement: 'none',
      };

    default:
      return {
        canWrite: false,
        canCommit: false,
        canGenerateCode: false,
        canRunTests: false,
        canAutoSplit: false,
        requiresApproval: true,
        requiresReview: true,
        humanInvolvement: 'full',
      };
  }
}
```

## @block:getAgentAutonomousPermissions @kind:function

```typescript
function getAgentAutonomousPermissions(
  projectLevel: ProjectLevel,
  role: AgentRole
): BehaviorPermissions {
  // Agent autonomous has more permissions than agent_assisted
  switch (projectLevel) {
    case 'POC':
      return {
        canWrite: false,
        canCommit: false,
        canGenerateCode: false,
        canRunTests: false,
        canAutoSplit: false,
        requiresApproval: true,
        requiresReview: true,
        humanInvolvement: 'full',
      };

    case 'MVP':
      return {
        canWrite: true,
        canCommit: false,
        canGenerateCode: true,
        canRunTests: true,
        canAutoSplit: false,
        requiresApproval: true,
        requiresReview: true,
        humanInvolvement: 'approval',
      };

    case 'Alpha':
    case 'Startup':
      return {
        canWrite: true,
        canCommit: true,
        canGenerateCode: true,
        canRunTests: true,
        canAutoSplit: true,
        requiresApproval: false,
        requiresReview: true,
        humanInvolvement: 'monitoring',
      };

    case 'Beta':
      return {
        canWrite: true,
        canCommit: true,
        canGenerateCode: true,
        canRunTests: true,
        canAutoSplit: true,
        requiresApproval: false,
        requiresReview: false,
        humanInvolvement: 'none',
      };

    case 'Production':
    case 'Enterprise':
      return {
        canWrite: true,
        canCommit: true,
        canGenerateCode: true,
        canRunTests: true,
        canAutoSplit: true,
        requiresApproval: false,
        requiresReview: false,
        humanInvolvement: 'none',
      };

    default:
      return {
        canWrite: false,
        canCommit: false,
        canGenerateCode: false,
        canRunTests: false,
        canAutoSplit: false,
        requiresApproval: true,
        requiresReview: true,
        humanInvolvement: 'full',
      };
  }
}
```

## @block:getResourceBudget @kind:function

```typescript
/**
 * Get resource budget based on project level and agent support
 */
export function getResourceBudget(
  projectLevel: ProjectLevel,
  agentSupport: AgentSupportLevel
): 'minimal' | 'basic' | 'moderate' | 'substantial' | 'full' | 'maximum' {
  // Human-only gets no computational resources
  if (agentSupport === 'human_only') {
    return 'minimal';
  }

  const levelBudgets: Record<ProjectLevel, 'minimal' | 'basic' | 'moderate' | 'substantial' | 'full' | 'maximum'> = {
    'POC': 'minimal',
    'MVP': 'basic',
    'Alpha': 'moderate',
    'Beta': 'substantial',
    'Production': 'full',
    'Startup': 'moderate',
    'Enterprise': 'maximum',
  };

  // Agent assisted gets lower budget
  if (agentSupport === 'agent_assisted') {
    const assistedBudgets: Record<ProjectLevel, 'minimal' | 'basic' | 'moderate' | 'substantial' | 'full' | 'maximum'> = {
      'POC': 'minimal',
      'MVP': 'basic',
      'Alpha': 'basic',
      'Beta': 'moderate',
      'Production': 'substantial',
      'Startup': 'basic',
      'Enterprise': 'full',
    };
    return assistedBudgets[projectLevel];
  }

  return levelBudgets[projectLevel];
}
```

## @block:getFallbackLevel @kind:function

```typescript
/**
 * Get fallback agent support level when failures occur
 */
export function getFallbackLevel(
  currentLevel: AgentSupportLevel,
  failureCount: number
): AgentSupportLevel {
  if (failureCount === 0) {
    return currentLevel;
  }

  // Escalation path: current → assisted → human_only
  if (currentLevel === 'agent_autonomous') {
    if (failureCount >= 3) {
      return 'human_only';
    }
    return 'agent_assisted';
  }

  if (currentLevel === 'agent_assisted') {
    return 'human_only';
  }

  return 'human_only';
}
```
