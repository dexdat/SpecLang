/**
 * SPECLANG-GENERATED: Human-only agent support types
 * Source: @specs/agent-support-levels/levels#human-only
 */

export interface HumanOnlyPolicy {
  /** Whether spec requires human interpretation */
  requiresHumanInterpretation: boolean;
  /** Allowed agent actions */
  allowedActions: AgentAction[];
  /** Required human confirmations */
  requiredConfirmations: ConfirmationType[];
  /** Approval workflow steps */
  approvalSteps: ApprovalStep[];
  /** Oversight mechanisms */
  oversightMechanisms: OversightMechanism[];
  /** Restrictions on agent behavior */
  restrictions: Restriction[];
}

export type AgentAction = 
  | 'read_spec'
  | 'suggest_improvements'
  | 'propose_edits'
  | 'generate_draft_code'
  | 'run_tests'
  | 'report_results';

export type ConfirmationType =
  | 'interpretation_confirmation'
  | 'decision_confirmation'
  | 'execution_confirmation';

export interface ApprovalStep {
  step: string;
  required: boolean;
  humanRole: string;
}

export interface OversightMechanism {
  type: string;
  description: string;
  frequency: 'continuous' | 'periodic' | 'on_demand';
}

export interface Restriction {
  action: AgentAction;
  condition?: string;
  enforcement: 'block' | 'warn' | 'require_confirmation';
}

export interface HumanOnlyValidationResult {
  specId: string;
  passed: boolean;
  violations: Violation[];
  suggestions: string[];
}

export interface Violation {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}