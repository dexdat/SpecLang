// SPECLANG-GENERATED: @speclang/transition-workflows/upgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/upgrade.spec.md

/**
 * Core types (simplified)
 */
export type MaturityLevel = 
  | 'POC'
  | 'MVP'
  | 'Alpha'
  | 'Beta'
  | 'Production'
  | 'Startup'
  | 'SMB'
  | 'MSB'
  | 'Enterprise';

export type AgentSupport = 
  | 'human_only'
  | 'agent_assisted'
  | 'agent_autonomous';

export interface ParsedSpec {
  metadata: {
    id?: string;
    version?: string;
    layer?: number;
    tags?: string[];
    short?: string;
    status?: string;
    project_level?: string;
    agent_support?: string;
    [key: string]: unknown;
  };
  content?: string;
  blocks?: Array<{
    id?: string;
    content?: string;
    [key: string]: unknown;
  }>;
  testCoverage?: Record<string, boolean>;
}

export interface TransitionCheck {
  category: 'spec' | 'validation' | 'test' | 'documentation' | 'approval' | 'automated' | 'agent' | 'human' | 'safety' | 'documentation' | 'testing' | 'review' | 'deployment';
  description: string;
  required: boolean;
  automated: boolean;
}

export interface TransitionChecklist {
  from: string;
  to: string;
  checks: TransitionCheck[];
}

export interface TransitionResult {
  canTransition: boolean;
  reason?: string;
  results?: CheckResult[];
  blockingChecks?: CheckResult[];
}

export interface CheckResult {
  category: string;
  description: string;
  passed: boolean;
  required: boolean;
  message?: string;
}

/**
 * Upgrade types
 */

export type UpgradeType = 'project_level' | 'agent_support' | 'combined';

export interface UpgradeTarget {
  project_level?: MaturityLevel;
  agent_support?: AgentSupport;
}

export interface UpgradePlan {
  specId: string;
  current: UpgradeTarget;
  target: UpgradeTarget;
  type: UpgradeType;
  checklists: TransitionChecklist[];
  estimatedDuration?: number;
  requiredApprovals?: string[];
}

export interface UpgradeCheck extends TransitionCheck {
  // same as TransitionCheck
}

export interface UpgradeChecklist extends TransitionChecklist {
  // same as TransitionChecklist
}

export interface UpgradeResult extends TransitionResult {
  plan: UpgradePlan;
  executedAt?: string;
  executedBy?: string;
}

export interface UpgradeOptions {
  skipValidation?: boolean;
  force?: boolean;
  dryRun?: boolean;
  approvalToken?: string;
}

/**
 * Helper functions
 */
export function isProjectLevelUpgrade(current: UpgradeTarget, target: UpgradeTarget): boolean {
  return current.project_level !== target.project_level && target.project_level !== undefined;
}

export function isAgentSupportUpgrade(current: UpgradeTarget, target: UpgradeTarget): boolean {
  return current.agent_support !== target.agent_support && target.agent_support !== undefined;
}

export function getUpgradeType(current: UpgradeTarget, target: UpgradeTarget): UpgradeType {
  const projectLevel = isProjectLevelUpgrade(current, target);
  const agentSupport = isAgentSupportUpgrade(current, target);
  
  if (projectLevel && agentSupport) return 'combined';
  if (projectLevel) return 'project_level';
  if (agentSupport) return 'agent_support';
  throw new Error('No upgrade detected');
}