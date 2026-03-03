/**
 * Ralph Loop - Type Definitions
 *
 * Dual-agent Ralph Loop with steering packets for building Speclang using Speclang.
 * This module provides types for the Builder Agent, Verifier Agent, Steering Packets,
 * Validation Pipeline, and Task management.
 *
 * @module ralph
 */
/**
 * Builder Agent role
 */
export type BuilderRole = "Write implementation specs and code";
/**
 * Builder Agent capabilities
 */
export type BuilderCapability = "Read all SIPs and existing specs" | "Write implementation specs (.spec.md or .spec.yaml)" | "Generate code from specs (.go.spec, .ts.spec)" | "Follow file naming conventions" | "Use speclang tools (when available)";
/**
 * Builder Agent trigger types
 */
export type BuilderTrigger = "Steering packet from Verifier" | "Todo list item" | "Manual human instruction";
/**
 * Builder Agent output types
 */
export type BuilderOutput = "New/modified spec files" | "Generated code files" | "Commit messages" | "Progress report";
/**
 * Builder Agent interface
 */
export interface BuilderAgent {
    role: BuilderRole;
    capabilities: BuilderCapability[];
    triggers: BuilderTrigger[];
    outputs: BuilderOutput[];
}
/**
 * Verifier Agent role
 */
export type VerifierRole = "Validate output, create steering packets";
/**
 * Verifier Agent capability
 */
export type VerifierCapability = "Validate spec format compliance" | "Check code compilation" | "Run tests" | "Verify references and dependencies" | "Create steering packets";
/**
 * Validation pipeline stage
 */
export type ValidationStage = "Spec Format Check" | "Header Compliance" | "Reference Validation" | "Code Compilation" | "Test Execution" | "Integration Test";
/**
 * Verifier Agent interface
 */
export interface VerifierAgent {
    role: VerifierRole;
    capabilities: VerifierCapability[];
    validation_pipeline: ValidationStage[];
    outputs: string[];
}
/**
 * Steering packet types
 */
export type SteeringPacketType = "error_report" | "fix_suggestion" | "priority_change" | "success_confirmation";
/**
 * Error Report steering packet
 */
export interface ErrorReportPacket {
    task_id: string;
    error_type: string;
    file_path: string;
    error_message: string;
    suggested_fix: string;
    priority: number;
}
/**
 * Fix Suggestion steering packet
 */
export interface FixSuggestionPacket {
    task_id: string;
    file_path: string;
    current_state: string;
    suggested_change: string;
    rationale: string;
}
/**
 * Priority Change steering packet
 */
export interface PriorityChangePacket {
    task_id: string;
    new_priority: number;
    reason: string;
    dependencies: string[];
}
/**
 * Success Confirmation steering packet
 */
export interface SuccessConfirmationPacket {
    task_id: string;
    files_created: string[];
    tests_passed: boolean;
    next_recommendation: string;
}
/**
 * Generic steering packet
 */
export interface SteeringPacket {
    id?: number;
    task_id: string;
    type: SteeringPacketType;
    payload: ErrorReportPacket | FixSuggestionPacket | PriorityChangePacket | SuccessConfirmationPacket;
    created_at: number;
    processed_at?: number;
}
/**
 * Validation pipeline stages
 */
export interface ValidationPipelineStage {
    stage_1_spec_format: {
        checks: string[];
    };
    stage_2_code_compilation: {
        checks: string[];
    };
    stage_3_test_execution: {
        checks: string[];
    };
    stage_4_integration: {
        checks: string[];
    };
}
/**
 * Validation result
 */
export interface ValidationResult {
    id?: string;
    task_id: string;
    stage: ValidationStage;
    passed: boolean;
    details: Record<string, unknown>;
    created_at: number;
}
/**
 * Task complexity estimation
 */
export type TaskComplexity = "low" | "medium" | "high";
/**
 * Task status
 */
export type TaskStatus = "pending" | "in_progress" | "done" | "failed";
/**
 * Task assignment
 */
export type TaskAssignment = "builder" | "verifier";
/**
 * Task interface representing a unit of work in the Ralph Loop
 */
export interface Task {
    id: string;
    description: string;
    depends_on: string[];
    estimated_complexity: TaskComplexity;
    priority: number;
    assigned_to: TaskAssignment | null;
    status: TaskStatus;
    created_at: number;
    started_at?: number;
    completed_at?: number;
}
/**
 * Todo List generated from spec analysis
 */
export interface TodoList {
    tasks: Task[];
    generated_at: number;
}
/**
 * Ralph Loop control state
 */
export interface LoopState {
    isRunning: boolean;
    currentTask: Task | null;
    todoList: Task[];
    iteration: number;
}
/**
 * Loop control configuration
 */
export interface LoopConfig {
    maxIterations: number;
    retryLimit: number;
    timeout: number;
}
/**
 * Implementation phases
 */
export type ImplementationPhase = "phase_1_manual_emulation" | "phase_2_semi_automated" | "phase_3_full_automation" | "phase_4_self_hosting";
/**
 * Phase details
 */
export interface PhaseDetails {
    phase: ImplementationPhase;
    description: string;
    goal: string;
}
/**
 * Failure domain types
 */
export type FailureDomain = "Spec format violations" | "Missing dependencies" | "Compilation errors" | "Test failures" | "Integration issues" | "Performance problems" | "Security vulnerabilities";
/**
 * Engineering response types
 */
export type EngineeringResponse = "Add validation checks" | "Create better error messages" | "Improve todo list generation" | "Enhance steering packets" | "Add recovery mechanisms" | "Update documentation/SIPs";
/**
 * Builder execution result
 */
export interface BuilderResult {
    success: boolean;
    output?: {
        specPath?: string;
        codeFiles?: string[];
    };
    error?: string;
}
/**
 * Verification result
 */
export interface VerificationResult {
    success: boolean;
    errors: string[];
    warnings?: string[];
    passedStages?: ValidationStage[];
}
/**
 * Default loop configuration
 */
export declare const DEFAULT_LOOP_CONFIG: LoopConfig;
/**
 * Validation pipeline order
 */
export declare const VALIDATION_PIPELINE: ValidationStage[];
/**
 * Implementation phases in order
 */
export declare const IMPLEMENTATION_PHASES: PhaseDetails[];
//# sourceMappingURL=types.d.ts.map