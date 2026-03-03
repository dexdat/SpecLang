"use strict";
/**
 * File ownership tracking
 *
 * Generated from: @speclang/agent-protocol/ownership
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipRegistry = void 0;
exports.createOwnershipRegistry = createOwnershipRegistry;
const minimatch_1 = require("minimatch");
const types_1 = require("./types");
/**
 * Ownership Registry - tracks which agent owns which files
 */
class OwnershipRegistry {
    rules;
    ownershipCache;
    constructor(rules = types_1.DEFAULT_OWNERSHIP_RULES) {
        this.rules = [...rules].sort((a, b) => b.priority - a.priority); // Sort by priority desc
        this.ownershipCache = new Map();
    }
    /**
     * Get the owner of a file
     */
    getOwner(filepath) {
        // Check cache first
        const cached = this.ownershipCache.get(filepath);
        if (cached !== undefined) {
            return cached;
        }
        // Find matching rule with highest priority
        let owner = null;
        let highestPriority = -1;
        for (const rule of this.rules) {
            for (const pattern of rule.patterns) {
                if (this.matchPattern(filepath, pattern)) {
                    if (rule.priority > highestPriority) {
                        owner = rule.agent;
                        highestPriority = rule.priority;
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
    canWrite(agentId, agentRole, filepath) {
        const owner = this.getOwner(filepath);
        if (!owner) {
            return {
                allowed: false,
                reason: 'No ownership rule matches this file',
            };
        }
        if (owner !== agentRole) {
            return {
                allowed: false,
                owner,
                reason: `File is owned by ${owner}, not ${agentRole}`,
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
    canRead(_agentId, _filepath) {
        return {
            allowed: true,
        };
    }
    /**
     * Register a new ownership rule
     */
    register(rule) {
        this.rules.push(rule);
        // Re-sort by priority
        this.rules.sort((a, b) => b.priority - a.priority);
        // Clear cache
        this.ownershipCache.clear();
    }
    /**
     * Remove an ownership rule
     */
    unregister(agent) {
        this.rules = this.rules.filter(r => r.agent !== agent);
        // Clear cache
        this.ownershipCache.clear();
    }
    /**
     * Get all files owned by a specific agent
     */
    getOwnedFiles(agentRole) {
        const rule = this.rules.find(r => r.agent === agentRole);
        return rule?.patterns || [];
    }
    /**
     * Get all ownership rules
     */
    getRules() {
        return [...this.rules];
    }
    /**
     * Match a filepath against a glob pattern
     */
    matchPattern(filepath, pattern) {
        // Normalize path separators
        const normalizedPath = filepath.replace(/\\/g, '/');
        const normalizedPattern = pattern.replace(/\\/g, '/');
        // Use minimatch for all patterns (handles **, *, ?, braces)
        return (0, minimatch_1.minimatch)(normalizedPath, normalizedPattern, {
            dot: true,
            noext: true,
        });
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
}
exports.OwnershipRegistry = OwnershipRegistry;
/**
 * Create a new ownership registry with default rules
 */
function createOwnershipRegistry(rules) {
    return new OwnershipRegistry(rules);
}
//# sourceMappingURL=ownership.js.map