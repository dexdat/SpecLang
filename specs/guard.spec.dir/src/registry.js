"use strict";
/**
 * Ownership Registry for Guard System
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipRegistry = void 0;
exports.createOwnershipRegistry = createOwnershipRegistry;
exports.createOverride = createOverride;
const minimatch_1 = require("minimatch");
const rules_1 = require("./rules");
/**
 * OwnershipRegistry - manages ownership rules and checks
 */
class OwnershipRegistry {
    rules;
    overrides = [];
    ownershipCache;
    constructor(rules = rules_1.DEFAULT_RULES) {
        // Sort by priority descending
        this.rules = [...rules].sort((a, b) => b.priority - a.priority);
        this.ownershipCache = new Map();
    }
    /**
     * Add a new rule to the registry
     */
    addRule(rule) {
        this.rules.push(rule);
        // Re-sort by priority descending
        this.rules.sort((a, b) => b.priority - a.priority);
        // Clear cache
        this.clearCache();
    }
    /**
     * Remove a rule by agent role
     */
    removeRule(agent) {
        this.rules = this.rules.filter(r => r.agent !== agent);
        this.clearCache();
    }
    /**
     * Get the owner of a file path
     */
    getOwner(filepath) {
        // Check for override first
        const override = this.getOverride(filepath);
        if (override) {
            return override.assignedAgent;
        }
        // Check cache
        const cached = this.ownershipCache.get(filepath);
        if (cached !== undefined) {
            return cached;
        }
        // Find matching rule with highest priority
        let owner = null;
        let highestPriority = -1;
        let matchedPatterns = [];
        for (const rule of this.rules) {
            for (const pattern of rule.patterns) {
                if (this.matchPattern(filepath, pattern)) {
                    if (rule.priority > highestPriority) {
                        owner = rule.agent;
                        highestPriority = rule.priority;
                        matchedPatterns = [pattern];
                    }
                    else if (rule.priority === highestPriority) {
                        matchedPatterns.push(pattern);
                    }
                }
            }
        }
        // Cache the result
        this.ownershipCache.set(filepath, owner);
        return owner;
    }
    /**
     * Check if an agent can write to a file
     */
    canWrite(agent, filepath) {
        // Orchestrator is always allowed (unless strict mode)
        if ((0, rules_1.isExemptFromGuard)(agent)) {
            return {
                allowed: true,
                owner: this.getOwner(filepath) || undefined,
            };
        }
        const owner = this.getOwner(filepath);
        if (!owner) {
            return {
                allowed: false,
                reason: 'No ownership rule matches this file',
            };
        }
        if (owner !== agent) {
            return {
                allowed: false,
                owner,
                reason: `File "${filepath}" is owned by ${owner}, not ${agent}`,
            };
        }
        return {
            allowed: true,
            owner,
        };
    }
    /**
     * Check if an agent can read a file (always allowed)
     */
    canRead(_agent, _filepath) {
        return {
            allowed: true,
        };
    }
    /**
     * Get all files owned by a specific agent
     */
    getOwnedFiles(agent) {
        const rule = this.rules.find(r => r.agent === agent);
        return rule?.patterns || [];
    }
    /**
     * Get all rules
     */
    getRules() {
        return [...this.rules];
    }
    /**
     * Add an override for a specific file
     */
    addOverride(override) {
        // Remove existing override for same file
        this.overrides = this.overrides.filter(o => o.filepath !== override.filepath);
        this.overrides.push(override);
        this.clearCache();
    }
    /**
     * Remove an override
     */
    removeOverride(filepath) {
        const initialLength = this.overrides.length;
        this.overrides = this.overrides.filter(o => o.filepath !== filepath);
        this.clearCache();
        return this.overrides.length < initialLength;
    }
    /**
     * Get override for a file
     */
    getOverride(filepath) {
        return this.overrides.find(o => o.filepath === filepath);
    }
    /**
     * Get all overrides
     */
    getOverrides() {
        return [...this.overrides];
    }
    /**
     * Resolve conflicts between agents claiming same files
     */
    resolveConflicts() {
        const conflicts = [];
        const fileClaims = new Map();
        // Collect all claims
        for (const rule of this.rules) {
            for (const pattern of rule.patterns) {
                // Simple conflict detection for exact patterns
                // In production, this would use glob expansion
                const exactFiles = this.getFilesMatchingPattern(pattern);
                for (const file of exactFiles) {
                    const claims = fileClaims.get(file) || [];
                    claims.push(rule.agent);
                    fileClaims.set(file, claims);
                }
            }
        }
        // Find conflicts (files claimed by multiple agents with same priority)
        const claimed = Array.from(fileClaims.entries());
        for (const [file, agents] of claimed) {
            if (agents.length > 1) {
                // Find winner by highest priority
                let winner = agents[0];
                let highestPriority = -1;
                for (const agent of agents) {
                    const rule = this.rules.find(r => r.agent === agent);
                    if (rule && rule.priority > highestPriority) {
                        highestPriority = rule.priority;
                        winner = agent;
                    }
                }
                conflicts.push({
                    file,
                    claimingAgents: agents,
                    winner,
                    reason: `Winner determined by highest priority (${highestPriority})`,
                });
            }
        }
        return conflicts;
    }
    /**
     * Match a filepath against a glob pattern
     */
    matchPattern(filepath, pattern) {
        const normalizedPath = filepath.replace(/\\/g, '/');
        const normalizedPattern = pattern.replace(/\\/g, '/');
        return (0, minimatch_1.minimatch)(normalizedPath, normalizedPattern, {
            dot: true,
            noext: true,
        });
    }
    /**
     * Get files matching a pattern (simplified)
     * In production, this would use glob expansion
     */
    getFilesMatchingPattern(pattern) {
        // This is a simplified version
        // In production, you'd use fs.glob or similar
        if (pattern.includes('*')) {
            return [pattern]; // Return pattern as-is for glob patterns
        }
        return [pattern];
    }
    /**
     * Invalidate cache for a specific file
     */
    invalidate(filepath) {
        this.ownershipCache.delete(filepath);
    }
    /**
     * Clear entire cache
     */
    clearCache() {
        this.ownershipCache.clear();
    }
    /**
     * Get ownership info for multiple files
     */
    getOwnershipBatch(files) {
        const results = new Map();
        for (const file of files) {
            results.set(file, this.getOwner(file));
        }
        return results;
    }
    /**
     * Check if a filepath matches any rule
     */
    hasMatchingRule(filepath) {
        return this.getOwner(filepath) !== null;
    }
    /**
     * Get rule for an agent
     */
    getRuleForAgent(agent) {
        return this.rules.find(r => r.agent === agent);
    }
}
exports.OwnershipRegistry = OwnershipRegistry;
/**
 * Create a new ownership registry with default rules
 */
function createOwnershipRegistry(rules) {
    return new OwnershipRegistry(rules);
}
/**
 * Create an override rule
 */
function createOverride(filepath, assignedAgent, reason, createdBy, expiresInMs) {
    return {
        filepath,
        assignedAgent,
        reason,
        createdBy,
        createdAt: new Date(),
        expiresAt: expiresInMs ? new Date(Date.now() + expiresInMs) : undefined,
    };
}
//# sourceMappingURL=registry.js.map