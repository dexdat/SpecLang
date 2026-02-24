/**
 * SPECLANG-GENERATED: Validation engine
 * Source: @speclang/validation
 */

import type { 
  ParsedSpec, 
  ValidationRule, 
  ValidationResult, 
  ValidationReport,
  ValidationContext,
  ValidationConfig,
  ValidationReportBatch,
} from './types';
import { RuleRegistry, getRegistry } from './rules';
import { DEFAULT_VALIDATION_CONFIG } from './types';

/**
 * Validation Engine
 * 
 * Executes validation rules against specs and produces reports.
 */
export class ValidationEngine {
  private registry: RuleRegistry;
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.registry = getRegistry();
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
    
    // Apply config to registry
    this.registry.applyConfig(this.config);
  }

  /**
   * Validate a single spec
   */
  async validate(spec: ParsedSpec, context?: Partial<ValidationContext>): Promise<ValidationReport> {
    const fullContext = this.buildContext(spec, context);
    const allResults: ValidationResult[] = [];
    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];

    // Run all enabled rules
    const rules = this.registry.getEnabled();
    
    for (const rule of rules) {
      try {
        const results = rule.check(spec, fullContext);
        allResults.push(...results);
      } catch (error) {
        // Log rule error but continue
        console.error(`Error running rule ${rule.id}:`, error);
        allResults.push({
          rule: rule.id,
          level: 'error',
          location: { file: spec.filepath, line: 'content' },
          message: `Rule ${rule.id} failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Separate errors and warnings
    for (const result of allResults) {
      if (result.level === 'error') {
        errors.push(result);
      } else {
        warnings.push(result);
      }
    }

    // In strict mode, treat warnings as errors
    const finalErrors = this.config.strict ? [...errors, ...warnings] : errors;
    const finalWarnings = this.config.strict ? [] : warnings;

    return {
      file: spec.filepath,
      errors: finalErrors,
      warnings: finalWarnings,
      passed: finalErrors.length === 0,
      timestamp: new Date(),
    };
  }

  /**
   * Validate multiple specs
   */
  async validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]> {
    // Build full context from all specs
    const context = this.buildFullContext(specs);
    
    // Validate each spec
    const reports: ValidationReport[] = [];
    
    for (const spec of specs) {
      const report = await this.validate(spec, context);
      reports.push(report);
    }

    return reports;
  }

  /**
   * Validate and return batch report
   */
  async validateBatch(specs: ParsedSpec[]): Promise<ValidationReportBatch> {
    const reports = await this.validateAll(specs);
    
    const totalErrors = reports.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = reports.reduce((sum, r) => sum + r.warnings.length, 0);
    const passed = reports.filter(r => r.passed).length;
    
    return {
      reports,
      summary: {
        total: specs.length,
        passed,
        failed: specs.length - passed,
        errors: totalErrors,
        warnings: totalWarnings,
      },
    };
  }

  /**
   * Build validation context for a single spec
   */
  private buildContext(spec: ParsedSpec, context?: Partial<ValidationContext>): ValidationContext {
    return {
      baseDir: context?.baseDir || process.cwd(),
      allSpecs: context?.allSpecs || new Map([[spec.metadata.id || spec.filepath, spec]]),
      dependencyGraph: context?.dependencyGraph || new Map(),
      config: this.config,
      fs: context?.fs || {
        exists: async () => false,
        readFile: async () => '',
        readDir: async () => [],
      },
    };
  }

  /**
   * Build full validation context from all specs
   */
  private buildFullContext(specs: ParsedSpec[]): Partial<ValidationContext> {
    const allSpecs = new Map<string, ParsedSpec>();
    const dependencyGraph = new Map<string, string[]>();

    for (const spec of specs) {
      const id = spec.metadata.id || spec.filepath;
      allSpecs.set(id, spec);
      allSpecs.set(spec.filepath, spec);

      // Build dependency graph
      const deps: string[] = [];
      if (spec.metadata.depends_on) {
        for (const dep of spec.metadata.depends_on) {
          const depId = typeof dep === 'string' ? dep : dep.ref || dep.toString();
          deps.push(depId);
        }
      }
      dependencyGraph.set(id, deps);
    }

    return { allSpecs, dependencyGraph };
  }

  /**
   * Get the rule registry
   */
  getRegistry(): RuleRegistry {
    return this.registry;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
    this.registry.applyConfig(this.config);
  }

  /**
   * Get configuration
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  /**
   * Add a custom rule
   */
  addRule(rule: ValidationRule): void {
    this.registry.register(rule);
  }

  /**
   * Remove a rule
   */
  removeRule(id: string): boolean {
    return this.registry.unregister(id);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

let globalEngine: ValidationEngine | null = null;

/**
 * Get the global validation engine
 */
export function getEngine(config?: Partial<ValidationConfig>): ValidationEngine {
  if (!globalEngine) {
    globalEngine = new ValidationEngine(config);
  }
  return globalEngine;
}

/**
 * Reset the global engine
 */
export function resetEngine(): void {
  globalEngine = null;
}

/**
 * Quick validate function
 */
export async function validate(spec: ParsedSpec, context?: Partial<ValidationContext>): Promise<ValidationReport> {
  const engine = new ValidationEngine();
  return engine.validate(spec, context);
}

/**
 * Quick validate all function
 */
export async function validateAll(specs: ParsedSpec[]): Promise<ValidationReport[]> {
  const engine = new ValidationEngine();
  return engine.validateAll(specs);
}
