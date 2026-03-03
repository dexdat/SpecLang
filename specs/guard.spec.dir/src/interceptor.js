"use strict";
/**
 * Write Interceptor for Guard System
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
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
exports.WriteInterceptor = void 0;
exports.createWriteInterceptor = createWriteInterceptor;
const path = __importStar(require("path"));
const types_1 = require("./types");
const registry_1 = require("./registry");
const violations_1 = require("./violations");
const rules_1 = require("./rules");
const types_2 = require("./types");
/**
 * WriteInterceptor - intercepts file write operations and enforces ownership
 */
class WriteInterceptor {
    registry;
    violations;
    config;
    stats;
    constructor(registry, violations, config = {}) {
        this.registry = registry;
        this.violations = violations;
        this.config = { ...types_1.DEFAULT_GUARD_CONFIG, ...config };
        this.stats = this.initStats();
    }
    /**
     * Initialize stats
     */
    initStats() {
        const byAgent = {};
        for (const role of types_2.GUARD_AGENT_ROLES) {
            byAgent[role] = { allowed: 0, blocked: 0 };
        }
        return {
            totalChecks: 0,
            allowed: 0,
            blocked: 0,
            violations: 0,
            byAgent,
        };
    }
    /**
     * Intercept a write operation
     */
    async interceptWrite(agent, filepath, _content) {
        // Update stats
        this.stats.totalChecks++;
        // Check if guard is enabled
        if (!this.config.enabled) {
            this.stats.allowed++;
            this.updateAgentStats(agent, true);
            return {
                allowed: true,
                reason: 'Guard is disabled',
            };
        }
        // Check if orchestrator is exempt
        if (!this.config.enforceOnOrchestrator && (0, rules_1.isExemptFromGuard)(agent)) {
            this.stats.allowed++;
            this.updateAgentStats(agent, true);
            return {
                allowed: true,
                reason: 'Orchestrator is exempt from guard',
            };
        }
        // Get ownership info
        const owner = this.registry.getOwner(filepath);
        const rule = owner ? this.registry.getRuleForAgent(owner) : undefined;
        // Check ownership
        if (owner !== agent) {
            // Block the write
            this.stats.blocked++;
            this.stats.violations++;
            this.updateAgentStats(agent, false);
            // Create violation
            const violationId = this.violations.record({
                agent,
                filepath,
                attemptedAction: 'write',
            });
            // Log if enabled
            if (this.config.logViolations) {
                console.error(`[Guard] BLOCKED: ${agent} attempted to write to ${filepath} ` +
                    `(owned by ${owner || 'none'})`);
            }
            return {
                allowed: false,
                reason: `File "${filepath}" is owned by ${owner || 'no one'}, not ${agent}`,
                violation: this.violations.get(violationId),
                metadata: {
                    owner: owner || undefined,
                    patterns: rule?.patterns,
                    priority: rule?.priority,
                },
            };
        }
        // Allow the write
        this.stats.allowed++;
        this.updateAgentStats(agent, true);
        return {
            allowed: true,
            reason: 'Ownership check passed',
            metadata: {
                owner,
                patterns: rule?.patterns,
                priority: rule?.priority,
            },
        };
    }
    /**
     * Intercept a delete operation
     */
    async interceptDelete(agent, filepath) {
        this.stats.totalChecks++;
        if (!this.config.enabled) {
            this.stats.allowed++;
            return { allowed: true, reason: 'Guard is disabled' };
        }
        if (!this.config.enforceOnOrchestrator && (0, rules_1.isExemptFromGuard)(agent)) {
            this.stats.allowed++;
            return { allowed: true, reason: 'Orchestrator is exempt' };
        }
        const owner = this.registry.getOwner(filepath);
        if (owner !== agent) {
            this.stats.blocked++;
            this.stats.violations++;
            this.updateAgentStats(agent, false);
            const violationId = this.violations.record({
                agent,
                filepath,
                attemptedAction: 'delete',
            });
            if (this.config.logViolations) {
                console.error(`[Guard] BLOCKED: ${agent} attempted to delete ${filepath} ` +
                    `(owned by ${owner || 'none'})`);
            }
            return {
                allowed: false,
                reason: `File "${filepath}" is owned by ${owner || 'no one'}, not ${agent}`,
                violation: this.violations.get(violationId),
            };
        }
        this.stats.allowed++;
        this.updateAgentStats(agent, true);
        return { allowed: true, reason: 'Ownership check passed' };
    }
    /**
     * Intercept a rename operation
     */
    async interceptRename(agent, oldPath, newPath) {
        this.stats.totalChecks++;
        if (!this.config.enabled) {
            this.stats.allowed++;
            return { allowed: true, reason: 'Guard is disabled' };
        }
        if (!this.config.enforceOnOrchestrator && (0, rules_1.isExemptFromGuard)(agent)) {
            this.stats.allowed++;
            return { allowed: true, reason: 'Orchestrator is exempt' };
        }
        // Check ownership of both old and new paths
        const oldOwner = this.registry.getOwner(oldPath);
        const newOwner = this.registry.getOwner(newPath);
        if (oldOwner !== agent || newOwner !== agent) {
            this.stats.blocked++;
            this.stats.violations++;
            this.updateAgentStats(agent, false);
            const violationId = this.violations.record({
                agent,
                filepath: oldPath,
                attemptedAction: 'rename',
                details: `Renaming from ${oldPath} to ${newPath}`,
            });
            if (this.config.logViolations) {
                console.error(`[Guard] BLOCKED: ${agent} attempted to rename ${oldPath} to ${newPath}`);
            }
            return {
                allowed: false,
                reason: `Cannot rename: ownership mismatch (old owner: ${oldOwner}, new owner: ${newOwner})`,
                violation: this.violations.get(violationId),
            };
        }
        this.stats.allowed++;
        this.updateAgentStats(agent, true);
        return { allowed: true, reason: 'Ownership check passed' };
    }
    /**
     * Validate file content based on type
     */
    async validateContent(filepath, content) {
        const errors = [];
        const warnings = [];
        const ext = path.extname(filepath).toLowerCase();
        const basename = path.basename(filepath);
        // Validate spec files
        if (ext === '.md' || ext === '.yaml' || ext === '.yml' || ext === '.scl') {
            // Check for speclang header in spec files
            if (filepath.startsWith('specs/') || filepath.includes('.spec.')) {
                if (!content.includes('speclang-header') && !content.includes('# speclang')) {
                    warnings.push('Spec file missing speclang header');
                }
            }
        }
        // Validate TypeScript files
        if (ext === '.ts') {
            // Check for common issues
            if (content.includes('any') && !content.includes('// eslint')) {
                warnings.push('TypeScript file contains "any" type');
            }
        }
        // Check for empty files
        if (!content.trim()) {
            errors.push('File content is empty');
        }
        // Check for very large files
        if (content.length > 1_000_000) {
            warnings.push('File is very large (>1MB)');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Check ownership without performing the write
     */
    checkOwnership(agent, filepath) {
        const owner = this.registry.getOwner(filepath);
        const rule = owner ? this.registry.getRuleForAgent(owner) : undefined;
        if (owner !== agent) {
            return {
                allowed: false,
                reason: `File "${filepath}" is owned by ${owner || 'no one'}, not ${agent}`,
                metadata: {
                    owner: owner || undefined,
                    patterns: rule?.patterns,
                    priority: rule?.priority,
                },
            };
        }
        return {
            allowed: true,
            reason: 'Ownership check passed',
            metadata: {
                owner,
                patterns: rule?.patterns,
                priority: rule?.priority,
            },
        };
    }
    /**
     * Update stats for an agent
     */
    updateAgentStats(agent, allowed) {
        const stats = this.stats.byAgent[agent];
        if (stats) {
            if (allowed) {
                stats.allowed++;
            }
            else {
                stats.blocked++;
            }
        }
    }
    /**
     * Get current stats
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset stats
     */
    resetStats() {
        this.stats = this.initStats();
    }
    /**
     * Get the registry
     */
    getRegistry() {
        return this.registry;
    }
    /**
     * Get the violations tracker
     */
    getViolations() {
        return this.violations;
    }
    /**
     * Get config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
exports.WriteInterceptor = WriteInterceptor;
/**
 * Create a write interceptor with default config
 */
function createWriteInterceptor(registry, violations, config) {
    return new WriteInterceptor(registry || new registry_1.OwnershipRegistry(), violations || new violations_1.ViolationTracker(), config);
}
//# sourceMappingURL=interceptor.js.map