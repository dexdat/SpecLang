"use strict";
/**
 * SPECLANG-GENERATED: Rule registry
 * Source: @speclang/validation/rules
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.autonomousRule = exports.blocksRule = exports.refsRule = exports.idRule = exports.headerRule = exports.RuleRegistry = exports.BUILTIN_RULES = void 0;
exports.getRegistry = getRegistry;
exports.resetRegistry = resetRegistry;
// Import all built-in rules
const header_1 = require("./header");
Object.defineProperty(exports, "headerRule", { enumerable: true, get: function () { return header_1.headerRule; } });
const id_1 = require("./id");
Object.defineProperty(exports, "idRule", { enumerable: true, get: function () { return id_1.idRule; } });
const refs_1 = require("./refs");
Object.defineProperty(exports, "refsRule", { enumerable: true, get: function () { return refs_1.refsRule; } });
const blocks_1 = require("./blocks");
Object.defineProperty(exports, "blocksRule", { enumerable: true, get: function () { return blocks_1.blocksRule; } });
const autonomous_1 = require("./autonomous");
Object.defineProperty(exports, "autonomousRule", { enumerable: true, get: function () { return autonomous_1.autonomousRule; } });
/** Built-in validation rules */
exports.BUILTIN_RULES = [
    header_1.headerRule, // @validation/header
    id_1.idRule, // @validation/id
    refs_1.refsRule, // @validation/refs
    blocks_1.blocksRule, // @validation/blocks
    autonomous_1.autonomousRule, // @validation/autonomous
];
/**
 * Rule Registry
 *
 * Manages registration and retrieval of validation rules.
 */
class RuleRegistry {
    rules = new Map();
    enabledRules = new Set();
    constructor() {
        // Register all built-in rules
        for (const rule of exports.BUILTIN_RULES) {
            this.register(rule);
        }
    }
    /**
     * Register a validation rule
     */
    register(rule) {
        if (this.rules.has(rule.id)) {
            console.warn(`Rule ${rule.id} already registered, overwriting`);
        }
        this.rules.set(rule.id, rule);
        this.enabledRules.add(rule.id);
    }
    /**
     * Unregister a validation rule
     */
    unregister(id) {
        this.enabledRules.delete(id);
        return this.rules.delete(id);
    }
    /**
     * Get a rule by ID
     */
    get(id) {
        return this.rules.get(id);
    }
    /**
     * Get all registered rules
     */
    getAll() {
        return Array.from(this.rules.values());
    }
    /**
     * Get enabled rules
     */
    getEnabled() {
        return this.getAll().filter(rule => this.enabledRules.has(rule.id));
    }
    /**
     * Get rules by level
     */
    getByLevel(level) {
        return this.getAll().filter(rule => rule.level === level);
    }
    /**
     * Enable a rule
     */
    enable(id) {
        if (!this.rules.has(id)) {
            return false;
        }
        this.enabledRules.add(id);
        return true;
    }
    /**
     * Disable a rule
     */
    disable(id) {
        return this.enabledRules.delete(id);
    }
    /**
     * Check if a rule is enabled
     */
    isEnabled(id) {
        return this.enabledRules.has(id);
    }
    /**
     * Apply configuration to rules
     */
    applyConfig(config) {
        if (!config.rules)
            return;
        // Disable all rules first
        this.enabledRules.clear();
        // Enable default rules if no specific config
        const hasRuleConfig = Object.keys(config.rules).length > 0;
        if (!hasRuleConfig) {
            // Enable all built-in rules by default
            for (const rule of exports.BUILTIN_RULES) {
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
    async loadCustomRules(paths) {
        for (const path of paths) {
            try {
                // Dynamic import of custom rule module
                const module = await Promise.resolve(`${path}`).then(s => __importStar(require(s)));
                const customRule = module.default || module.rule;
                if (customRule && customRule.id) {
                    this.register(customRule);
                    console.log(`Loaded custom rule: ${customRule.id}`);
                }
                else {
                    console.warn(`Invalid custom rule at ${path}: missing id`);
                }
            }
            catch (error) {
                console.error(`Failed to load custom rule from ${path}:`, error);
            }
        }
    }
    /**
     * Get rule count
     */
    get count() {
        return this.rules.size;
    }
    /**
     * Get enabled rule count
     */
    get enabledCount() {
        return this.enabledRules.size;
    }
}
exports.RuleRegistry = RuleRegistry;
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/** Global rule registry instance */
let globalRegistry = null;
/**
 * Get the global rule registry
 */
function getRegistry() {
    if (!globalRegistry) {
        globalRegistry = new RuleRegistry();
    }
    return globalRegistry;
}
/**
 * Reset the global registry
 */
function resetRegistry() {
    globalRegistry = null;
}
//# sourceMappingURL=index.js.map