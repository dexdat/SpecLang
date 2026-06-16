"use strict";
/**
 * Violation Tracking for Guard System
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViolationTracker = void 0;
exports.createViolationTracker = createViolationTracker;
const types_1 = require("./types");
/**
 * Generates a unique violation ID
 */
function generateViolationId() {
    return `viol-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * ViolationTracker - tracks all violations in the system
 */
class ViolationTracker {
    violations = new Map();
    maxViolations;
    constructor(maxViolations = 1000) {
        this.maxViolations = maxViolations;
    }
    /**
     * Record a new violation
     * @returns The violation ID
     */
    record(violation) {
        const id = generateViolationId();
        const fullViolation = {
            ...violation,
            id,
            timestamp: new Date(),
            resolved: false,
        };
        this.violations.set(id, fullViolation);
        // Clean up old violations if we exceed max
        if (this.violations.size > this.maxViolations) {
            const oldestKey = this.violations.keys().next().value;
            if (oldestKey) {
                this.violations.delete(oldestKey);
            }
        }
        return id;
    }
    /**
     * Resolve a violation
     */
    resolve(violationId, resolution, by) {
        const violation = this.violations.get(violationId);
        if (!violation) {
            return false;
        }
        violation.resolved = true;
        violation.resolution = resolution;
        violation.resolutionBy = by;
        violation.resolutionAt = new Date();
        return true;
    }
    /**
     * Get all unresolved violations
     */
    getUnresolved() {
        return Array.from(this.violations.values())
            .filter(v => !v.resolved)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get violations by agent
     */
    getByAgent(agent) {
        return Array.from(this.violations.values())
            .filter(v => v.agent === agent)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get violations by file path
     */
    getByFilepath(filepath) {
        return Array.from(this.violations.values())
            .filter(v => v.filepath === filepath)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get all violations
     */
    getAll() {
        return Array.from(this.violations.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get a specific violation by ID
     */
    get(violationId) {
        return this.violations.get(violationId);
    }
    /**
     * Export violation report for analytics
     */
    export() {
        const all = Array.from(this.violations.values());
        const unresolved = all.filter(v => !v.resolved);
        const resolved = all.filter(v => v.resolved);
        // Count by agent
        const byAgent = {};
        for (const role of types_1.GUARD_AGENT_ROLES) {
            byAgent[role] = 0;
        }
        for (const v of unresolved) {
            byAgent[v.agent] = (byAgent[v.agent] || 0) + 1;
        }
        return {
            total: all.length,
            unresolved: unresolved.length,
            resolved: resolved.length,
            byAgent,
            recent: unresolved.slice(0, 10),
        };
    }
    /**
     * Clear all violations
     */
    clear() {
        this.violations.clear();
    }
    /**
     * Get violation count
     */
    count() {
        return this.violations.size;
    }
    /**
     * Get unresolved count
     */
    unresolvedCount() {
        return Array.from(this.violations.values()).filter(v => !v.resolved).length;
    }
    /**
     * Check if there are any unresolved violations
     */
    hasUnresolved() {
        return this.unresolvedCount() > 0;
    }
    /**
     * Get recent violations
     */
    getRecent(limit = 10) {
        return Array.from(this.violations.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
}
exports.ViolationTracker = ViolationTracker;
/**
 * Create a new violation tracker
 */
function createViolationTracker(maxViolations) {
    return new ViolationTracker(maxViolations);
}
//# sourceMappingURL=violations.js.map