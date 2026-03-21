/**
 * SPECLANG-GENERATED: Agent-assisted agent support types
 * Source: @specs/agent-support-levels/levels#agent-assisted
 */

/**
 * Agent-assisted execution levels
 */
export type AgentAssistedLevel = 
  | 'suggest_only'
  | 'execute_with_approval'
  | 'execute_with_guidance'
  | 'full_assistance';

/**
 * Configuration for agent-assisted mode
 */
export interface AgentAssistedConfig {
  level: AgentAssistedLevel;
  requireHumanGuidance: boolean;
  confirmationRequired: boolean;
  approvalRequired: boolean;
  suggestionsEnabled: boolean;
  checkpointFrequency: number;
}

/**
 * Result from agent-assisted enforcement check
 */
export interface AgentAssistedResult {
  allowed: boolean;
  requiresGuidance: boolean;
  requiresConfirmation: boolean;
  requiresApproval: boolean;
  pendingConfirmation?: boolean;
  confirmationPrompt?: string;
  suggestions: Suggestion[];
  checkpoints: Checkpoint[];
}

/**
 * Agent action types
 */
export type AgentAction = 
  | 'read_spec'
  | 'suggest_improvements'
  | 'propose_edits'
  | 'generate_draft_code'
  | 'run_tests'
  | 'report_results'
  | 'execute_with_guidance';

/**
 * Execution result from checkpoint
 */
export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
}

/**
 * Human guidance types
 */
export type GuidanceType = 
  | 'direction'
  | 'constraint'
  | 'preference'
  | 'correction'
  | 'approval';

/**
 * Human guidance interface
 */
export interface HumanGuidance {
  id: string;
  providedBy: string;
  providedAt: Date;
  type: GuidanceType;
  content: string;
  appliesTo: string[];
}

/**
 * Suggestion types
 */
export type SuggestionType = 
  | 'implementation_approach'
  | 'code_pattern'
  | 'test_strategy'
  | 'optimization'
  | 'learned_preference';

/**
 * Suggestion priority
 */
export type SuggestionPriority = 'high' | 'medium' | 'low';

/**
 * Suggestion interface
 */
export interface Suggestion {
  id: string;
  type: SuggestionType;
  content: string;
  confidence: number;
  source?: string;
  priority: SuggestionPriority;
}

/**
 * Checkpoint interface
 */
export interface Checkpoint {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  requiresHumanCheck: boolean;
  results?: CheckpointResult;
}

/**
 * Checkpoint result
 */
export interface CheckpointResult {
  success: boolean;
  output?: unknown;
  errors?: string[];
  duration: number;
}

/**
 * Handover event
 */
export interface HandoverEvent {
  id: string;
  from: 'human' | 'agent';
  to: 'human' | 'agent';
  reason: string;
  context: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Handover request
 */
export interface HandoverRequest {
  id: string;
  actionId: string;
  from: 'human' | 'agent';
  to: 'human' | 'agent';
  reason: string;
  context: Record<string, unknown>;
  status: 'pending' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

/**
 * Checkpoint guidance result
 */
export interface CheckpointGuidance {
  checkpointId: string;
  guidance: HumanGuidance | null;
  suggestions: Suggestion[];
  warnings: string[];
}

/**
 * Validation result
 */
export interface AgentAssistedValidationResult {
  specId: string;
  passed: boolean;
  violations: Violation[];
  suggestions: string[];
}

/**
 * Violation interface
 */
export interface Violation {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}
