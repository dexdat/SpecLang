/**
 * SPECLANG-GENERATED: Rule registry
 * Source: @speclang/validation/rules
 */
import type { ValidationRule, ValidationConfig } from '../types';
import { headerRule } from './header';
import { idRule } from './id';
import { refsRule } from './refs';
import { blocksRule } from './blocks';
import { autonomousRule } from './autonomous';
/** Built-in validation rules */
export declare const BUILTIN_RULES: ValidationRule[];
/**
 * Rule Registry
 *
 * Manages registration and retrieval of validation rules.
 */
export declare class RuleRegistry {
    private rules;
    private enabledRules;
    constructor();
    /**
     * Register a validation rule
     */
    register(rule: ValidationRule): void;
    /**
     * Unregister a validation rule
     */
    unregister(id: string): boolean;
    /**
     * Get a rule by ID
     */
    get(id: string): ValidationRule | undefined;
    /**
     * Get all registered rules
     */
    getAll(): ValidationRule[];
    /**
     * Get enabled rules
     */
    getEnabled(): ValidationRule[];
    /**
     * Get rules by level
     */
    getByLevel(level: 'error' | 'warning'): ValidationRule[];
    /**
     * Enable a rule
     */
    enable(id: string): boolean;
    /**
     * Disable a rule
     */
    disable(id: string): boolean;
    /**
     * Check if a rule is enabled
     */
    isEnabled(id: string): boolean;
    /**
     * Apply configuration to rules
     */
    applyConfig(config: ValidationConfig): void;
    /**
     * Load custom rules from paths
     */
    loadCustomRules(paths: string[]): Promise<void>;
    /**
     * Get rule count
     */
    get count(): number;
    /**
     * Get enabled rule count
     */
    get enabledCount(): number;
}
/**
 * Get the global rule registry
 */
export declare function getRegistry(): RuleRegistry;
/**
 * Reset the global registry
 */
export declare function resetRegistry(): void;
export { headerRule, idRule, refsRule, blocksRule, autonomousRule };
//# sourceMappingURL=index.d.ts.map