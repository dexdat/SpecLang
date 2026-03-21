// SPECLANG-GENERATED: @speclang/transition-workflows/downgrade
// DO NOT EDIT MANUALLY
// Source: specs/transition-workflows.spec.dir/downgrade.spec.md

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
  category: 'documentation' | 'testing' | 'review' | 'deployment';
  description: string;
  required: boolean;
  automated: boolean;
}

export interface TransitionChecklist {
  from: MaturityLevel;
  to: MaturityLevel;
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
 * Downgrade types
 */

export type DowngradeType = 'project_level' | 'agent_support' | 'combined';

export interface DowngradeTarget {
  project_level?: MaturityLevel;
  agent_support?: AgentSupport;
}

export interface DowngradeTrigger {
  type: 'regression' | 'security' | 'performance' | 'validation_failure' | 'stakeholder_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  detectedBy: string;
}

export interface DowngradePlan {
  specId: string;
  current: DowngradeTarget;
  target: DowngradeTarget;
  type: DowngradeType;
  triggers: DowngradeTrigger[];
  checklists: TransitionChecklist[];
  emergency: boolean;
  requiredApprovals?: string[];
}

export interface DowngradeResult extends TransitionResult {
  plan: DowngradePlan;
  executedAt?: string;
  executedBy?: string;
  rollbackRequired?: boolean;
}

export interface DowngradeOptions {
  emergencyBypass?: boolean;
  force?: boolean;
  dryRun?: boolean;
  approvalToken?: string;
}

/**
 * Helper functions
 */
export function isProjectLevelDowngrade(current: DowngradeTarget, target: DowngradeTarget): boolean {
  return current.project_level !== target.project_level && target.project_level !== undefined;
}

export function isAgentSupportDowngrade(current: DowngradeTarget, target: DowngradeTarget): boolean {
  return current.agent_support !== target.agent_support && target.agent_support !== undefined;
}

export function getDowngradeType(current: DowngradeTarget, target: DowngradeTarget): DowngradeType {
  const projectLevel = isProjectLevelDowngrade(current, target);
  const agentSupport = isAgentSupportDowngrade(current, target);
  
  if (projectLevel && agentSupport) return 'combined';
  if (projectLevel) return 'project_level';
  if (agentSupport) return 'agent_support';
  throw new Error('No downgrade detected');
}