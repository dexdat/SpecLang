"use strict";
/**
 * SPECLANG-GENERATED: Validation engine
 * Source: @speclang/validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationEngine = void 0;
exports.getEngine = getEngine;
exports.resetEngine = resetEngine;
exports.validate = validate;
exports.validateAll = validateAll;
const rules_1 = require("./rules");
const types_1 = require("./types");
/**
 * Validation Engine
 *
 * Executes validation rules against specs and produces reports.
 */
class ValidationEngine {
    registry;
    config;
    constructor(config = {}) {
        this.registry = (0, rules_1.getRegistry)();
        this.config = { ...types_1.DEFAULT_VALIDATION_CONFIG, ...config };
        // Apply config to registry
        this.registry.applyConfig(this.config);
    }
    /**
     * Validate a single spec
     */
    async validate(spec, context) {
        const fullContext = this.buildContext(spec, context);
        const allResults = [];
        const errors = [];
        const warnings = [];
        // Run all enabled rules
        const rules = this.registry.getEnabled();
        for (const rule of rules) {
            try {
                const results = rule.check(spec, fullContext);
                allResults.push(...results);
            }
            catch (error) {
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
            }
            else {
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
    async validateAll(specs) {
        // Build full context from all specs
        const context = this.buildFullContext(specs);
        // Validate each spec
        const reports = [];
        for (const spec of specs) {
            const report = await this.validate(spec, context);
            reports.push(report);
        }
        return reports;
    }
    /**
     * Validate and return batch report
     */
    async validateBatch(specs) {
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
    buildContext(spec, context) {
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
    buildFullContext(specs) {
        const allSpecs = new Map();
        const dependencyGraph = new Map();
        for (const spec of specs) {
            const id = spec.metadata.id || spec.filepath;
            allSpecs.set(id, spec);
            allSpecs.set(spec.filepath, spec);
            // Build dependency graph
            const deps = [];
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
    getRegistry() {
        return this.registry;
    }
    /**
     * Update configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        this.registry.applyConfig(this.config);
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Add a custom rule
     */
    addRule(rule) {
        this.registry.register(rule);
    }
    /**
     * Remove a rule
     */
    removeRule(id) {
        return this.registry.unregister(id);
    }
}
exports.ValidationEngine = ValidationEngine;
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
let globalEngine = null;
/**
 * Get the global validation engine
 */
function getEngine(config) {
    if (!globalEngine) {
        globalEngine = new ValidationEngine(config);
    }
    return globalEngine;
}
/**
 * Reset the global engine
 */
function resetEngine() {
    globalEngine = null;
}
/**
 * Quick validate function
 */
async function validate(spec, context) {
    const engine = new ValidationEngine();
    return engine.validate(spec, context);
}
/**
 * Quick validate all function
 */
async function validateAll(specs) {
    const engine = new ValidationEngine();
    return engine.validateAll(specs);
}
//# sourceMappingURL=engine.js.map