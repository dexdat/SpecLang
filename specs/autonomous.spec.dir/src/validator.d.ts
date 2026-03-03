/**
 * SPECLANG-GENERATED: Autonomous validator for validating system readiness
 * Source: @speclang/autonomous-validation
 */
import type { ValidationReport } from './types.js';
/**
 * Autonomous Validator - Validates system meets autonomous operation criteria
 */
export declare class AutonomousValidator {
    private specsDir;
    constructor(specsDir?: string);
    /**
     * Validate if system meets autonomous readiness criteria
     */
    validateAutonomousReadiness(): Promise<ValidationReport>;
    /**
     * Check that all specs have agent_support: agent_autonomous
     */
    private checkAgentSupport;
    /**
     * Check that all specs have step-by-step descriptions
     */
    private checkSpecCompleteness;
    /**
     * Check if content has step-by-step descriptions
     */
    private hasStepByStep;
    /**
     * Check that all @ref: references resolve
     */
    private checkReferenceResolution;
    /**
     * Check step-by-step coverage across all specs
     */
    private checkStepByStepCoverage;
    /**
     * Check that validation rules exist and are comprehensive
     */
    private checkValidationRules;
    /**
     * Check recovery mechanisms are in place
     */
    private checkRecoveryMechanisms;
    /**
     * Load all specs from the specs directory
     */
    loadAllSpecs(): Promise<string[]>;
}
/**
 * Convenience function to validate autonomous readiness
 */
export declare function validateAutonomousReadiness(specsDir?: string): Promise<ValidationReport>;
/**
 * Format validation report for console output
 */
export declare function formatValidationReport(report: ValidationReport): string;
//# sourceMappingURL=validator.d.ts.map