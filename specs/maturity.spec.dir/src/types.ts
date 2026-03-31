// SPECLANG-GENERATED: @speclang/project-maturity-levels
// DO NOT EDIT MANUALLY
// Source: specs/project-maturity-levels.dir/levels.spec.md

/**
 * Maturity Types
 * 
 * Defines the type system for project maturity levels,
 * agent support modes, and level criteria.
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

export type DocumentationLevel = 'sparse' | 'usable' | 'improving' | 'complete';
export type TestingLevel = 'minimal' | 'basic' | 'growing' | 'comprehensive' | 'full';
export type DeploymentLevel = 'none' | 'internal' | 'beta' | 'production';
export type StabilityLevel = 'experimental' | 'changing' | 'stable' | 'hardened';

export type AgentMode = 
  | 'confirm_each_step'
  | 'assisted_with_review'
  | 'autonomous_non_critical'
  | 'fully_autonomous';

export type HumanOversight = 'always' | 'major_changes' | 'critical_only' | 'emergencies';

export interface LevelCriteria {
  documentation: DocumentationLevel;
  testing: TestingLevel;
  deployment: DeploymentLevel;
  stability: StabilityLevel;
}

export interface AgentBehavior {
  mode: AgentMode;
  humanOversight: HumanOversight;
  cascadeDepth: number;
  autoDeploy: boolean;
  generationEnabled?: boolean;
  reviewRequired?: boolean;
}

export interface LevelDefinition {
  name: MaturityLevel;
  order: number;
  description: string;
  criteria: LevelCriteria;
  agentBehavior: AgentBehavior;
  requiredFields: string[];
  recommendedTests: string[];
  displayName?: string;
  recommendedFields?: string[];
  optionalFields?: string[];
  allowedTargets?: string[];
  constraints?: Record<string, any>;
}

export interface CriteriaResult {
  meetsCriteria: boolean;
  missing: string[];
  warnings: string[];
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

export interface ResolvedBehavior {
  confirmSteps: boolean;
  requireReview: boolean;
  maxCascadeDepth: number;
  allowAutoDeploy: boolean;
  allowDirectCascade: boolean;
  requireHumanApproval: boolean;
  notifyOnChanges: boolean;
}

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
    compliance?: string;
    audit?: string;
    governance?: string;
    depends_on?: string[];
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

export interface MaturityResult {
  valid: boolean;
  level: MaturityLevel;
  criteriaResults: CriteriaResult[];
  violations: string[];
  suggestions: string[];
}

export type ParsedSpecMetadata = ParsedSpec['metadata'];
