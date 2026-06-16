/**
 * SPECLANG-GENERATED: Rule registry
 * Source: @speclang/validation/rules
 */

import type { ValidationRule, ValidationConfig, ValidationContext } from '../types';

// Import all built-in rules
import { headerRule } from './header';
import { idRule } from './id';
import { refsRule } from './refs';
import { blocksRule } from './blocks';
import { autonomousRule } from './autonomous';

/** Built-in validation rules */
export const BUILTIN_RULES: ValidationRule[] = [
  headerRule,   // @validation/header
  idRule,       // @validation/id
  refsRule,     // @validation/refs
  blocksRule,   // @validation/blocks
  autonomousRule, // @validation/autonomous
];

/**
 * Rule Registry
 * 
 * Manages registration and retrieval of validation rules.
 */
export class RuleRegistry {
  private rules: Map<string, ValidationRule> = new Map();
  private enabledRules: Set<string> = new Set();

  constructor() {
    // Register all built-in rules
    for (const rule of BUILTIN_RULES) {
      this.register(rule);
    }
  }

  /**
   * Register a validation rule
   */
  register(rule: ValidationRule): void {
    if (this.rules.has(rule.id)) {
      console.warn(`Rule ${rule.id} already registered, overwriting`);
    }
    this.rules.set(rule.id, rule);
    this.enabledRules.add(rule.id);
  }

  /**
   * Unregister a validation rule
   */
  unregister(id: string): boolean {
    this.enabledRules.delete(id);
    return this.rules.delete(id);
  }

  /**
   * Get a rule by ID
   */
  get(id: string): ValidationRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get all registered rules
   */
  getAll(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get enabled rules
   */
  getEnabled(): ValidationRule[] {
    return this.getAll().filter(rule => this.enabledRules.has(rule.id));
  }

  /**
   * Get rules by level
   */
  getByLevel(level: 'error' | 'warning'): ValidationRule[] {
    return this.getAll().filter(rule => rule.level === level);
  }

  /**
   * Enable a rule
   */
  enable(id: string): boolean {
    if (!this.rules.has(id)) {
      return false;
    }
    this.enabledRules.add(id);
    return true;
  }

  /**
   * Disable a rule
   */
  disable(id: string): boolean {
    return this.enabledRules.delete(id);
  }

  /**
   * Check if a rule is enabled
   */
  isEnabled(id: string): boolean {
    return this.enabledRules.has(id);
  }

  /**
   * Apply configuration to rules
   */
  applyConfig(config: ValidationConfig): void {
    if (!config.rules) return;

    // Disable all rules first
    this.enabledRules.clear();

    // Enable default rules if no specific config
    const hasRuleConfig = Object.keys(config.rules).length > 0;
    
    if (!hasRuleConfig) {
      // Enable all built-in rules by default
      for (const rule of BUILTIN_RULES) {
        this.enabledRules.add(rule.id);
      }
      return;
    }

    // Apply specific rule settings
    for (const [ruleId, setting] of Object.entries(config.rules)) {
      if (setting.enabled !== false) {
        this.enabledRules.add(ruleId);
      }
    }
  }

  /**
   * Load custom rules from paths
   */
  async loadCustomRules(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        // Dynamic import of custom rule module
        const module = await import(path);
        const customRule = module.default || module.rule;
        
        if (customRule && customRule.id) {
          this.register(customRule);
          console.log(`Loaded custom rule: ${customRule.id}`);
        } else {
          console.warn(`Invalid custom rule at ${path}: missing id`);
        }
      } catch (error) {
        console.error(`Failed to load custom rule from ${path}:`, error);
      }
    }
  }

  /**
   * Get rule count
   */
  get count(): number {
    return this.rules.size;
  }

  /**
   * Get enabled rule count
   */
  get enabledCount(): number {
    return this.enabledRules.size;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/** Global rule registry instance */
let globalRegistry: RuleRegistry | null = null;

/**
 * Get the global rule registry
 */
export function getRegistry(): RuleRegistry {
  if (!globalRegistry) {
    globalRegistry = new RuleRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry
 */
export function resetRegistry(): void {
  globalRegistry = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { headerRule, idRule, refsRule, blocksRule, autonomousRule };
