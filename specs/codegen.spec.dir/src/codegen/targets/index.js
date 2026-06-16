"use strict";
/**
 * SPECLANG-GENERATED: Target registry for codegen
 * Source: @speclang/codegen @block:targets
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.targetRegistry = void 0;
exports.generateForSpec = generateForSpec;
exports.getGenerator = getGenerator;
exports.isTargetSupported = isTargetSupported;
exports.getSupportedTargets = getSupportedTargets;
exports.getAllGenerators = getAllGenerators;
const typescript_1 = require("./typescript");
const go_1 = require("./go");
const python_1 = require("./python");
const rust_1 = require("./rust");
// ============================================================================
// TARGET REGISTRY
// ============================================================================
/** Registry of all target generators */
class TargetRegistry {
    generators = new Map();
    constructor() {
        // Register all built-in generators
        this.register(new typescript_1.TypeScriptGenerator());
        this.register(new go_1.GoGenerator());
        this.register(new python_1.PythonGenerator());
        this.register(new rust_1.RustGenerator());
    }
    /** Register a target generator */
    register(generator) {
        this.generators.set(generator.language, generator);
    }
    /** Get generator for target language */
    get(target) {
        return this.generators.get(target);
    }
    /** Check if target is supported */
    has(target) {
        return this.generators.has(target);
    }
    /** Get all supported targets */
    supportedTargets() {
        return Array.from(this.generators.keys());
    }
    /** Get generators map for internal use */
    getGenerators() {
        return this.generators;
    }
    /** Generate code for a spec using appropriate target */
    generate(spec) {
        const generator = this.get(spec.target.language);
        if (!generator) {
            throw new Error(`Unsupported target: ${spec.target.language}`);
        }
        return generator.generate(spec);
    }
}
// Global registry instance
exports.targetRegistry = new TargetRegistry();
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/** Generate code for a spec */
function generateForSpec(spec) {
    return exports.targetRegistry.generate(spec);
}
/** Get generator for target language */
function getGenerator(target) {
    return exports.targetRegistry.get(target);
}
/** Check if target is supported */
function isTargetSupported(target) {
    return exports.targetRegistry.has(target);
}
/** Get list of supported targets */
function getSupportedTargets() {
    return exports.targetRegistry.supportedTargets();
}
/** Get all target generators */
function getAllGenerators() {
    return Array.from(exports.targetRegistry.getGenerators().values());
}
//# sourceMappingURL=index.js.map