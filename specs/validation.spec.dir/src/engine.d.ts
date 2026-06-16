/**
 * SPECLANG-GENERATED: Validation engine
 * Source: @speclang/validation
 */
import type { ParsedSpec, ValidationRule, ValidationReport, ValidationContext, ValidationConfig, ValidationReportBatch } from './types';
import { RuleRegistry } from './rules';
/**
 * Validation Engine
 *
 * Executes validation rules against specs and produces reports.
 */
export declare class ValidationEngine {
    private registry;
    private config;
    constructor(config?: Partial<ValidationConfig>);
    /**
     * Validate a single spec
     */
    validate(spec: ParsedSpec, context?: Partial<ValidationContext>): Promise<ValidationReport>;
    /**
     * Validate multiple specs
     */
    validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]>;
    /**
     * Validate and return batch report
     */
    validateBatch(specs: ParsedSpec[]): Promise<ValidationReportBatch>;
    /**
     * Build validation context for a single spec
     */
    private buildContext;
    /**
     * Build full validation context from all specs
     */
    private buildFullContext;
    /**
     * Get the rule registry
     */
    getRegistry(): RuleRegistry;
    /**
     * Update configuration
     */
    setConfig(config: Partial<ValidationConfig>): void;
    /**
     * Get configuration
     */
    getConfig(): ValidationConfig;
    /**
     * Add a custom rule
     */
    addRule(rule: ValidationRule): void;
    /**
     * Remove a rule
     */
    removeRule(id: string): boolean;
}
/**
 * Get the global validation engine
 */
export declare function getEngine(config?: Partial<ValidationConfig>): ValidationEngine;
/**
 * Reset the global engine
 */
export declare function resetEngine(): void;
/**
 * Quick validate function
 */
export declare function validate(spec: ParsedSpec, context?: Partial<ValidationContext>): Promise<ValidationReport>;
/**
 * Quick validate all function
 */
export declare function validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]>;
//# sourceMappingURL=engine.d.ts.map