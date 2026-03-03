"use strict";
/**
 * Violation Tracker - Records and reports ownership violations
 *
 * Generated from: @speclang/agent-protocol @block:violationtracker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViolationTracker = void 0;
exports.createViolationTracker = createViolationTracker;
const DEFAULT_MAX_VIOLATIONS = 1000;
class ViolationTracker {
    violations;
    maxViolations;
    constructor(maxViolations = DEFAULT_MAX_VIOLATIONS) {
        this.violations = new Map();
        this.maxViolations = maxViolations;
    }
    /**
     * Generate unique violation ID
     */
    generateId() {
        return `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Record a new violation
     */
    record(violation) {
        const id = this.generateId();
        const fullViolation = {
            ...violation,
            id,
            resolved: false,
        };
        this.violations.set(id, fullViolation);
        if (this.violations.size > this.maxViolations) {
            this.prune();
        }
        console.log(`[ViolationTracker] Recorded violation: ${violation.action} - ${violation.reason}`);
        return fullViolation;
    }
    /**
     * Get violation by ID
     */
    get(id) {
        return this.violations.get(id);
    }
    /**
     * Get all violations
     */
    getViolations() {
        return Array.from(this.violations.values());
    }
    /**
     * Get unresolved violations
     */
    getUnresolved() {
        return Array.from(this.violations.values()).filter(v => !v.resolved);
    }
    /**
     * Get violations for a specific agent
     */
    getByAgent(agentId) {
        return Array.from(this.violations.values()).filter(v => v.agentId === agentId);
    }
    /**
     * Get violations for a specific file
     */
    getByFile(filepath) {
        return Array.from(this.violations.values()).filter(v => v.filepath === filepath);
    }
    /**
     * Mark a violation as resolved
     */
    resolve(id) {
        const violation = this.violations.get(id);
        if (violation) {
            violation.resolved = true;
            return true;
        }
        return false;
    }
    /**
     * Get statistics
     */
    getStats() {
        const violations = Array.from(this.violations.values());
        const byAgent = {};
        const byAction = {};
        for (const v of violations) {
            byAgent[v.agentRole] = (byAgent[v.agentRole] || 0) + 1;
            byAction[v.action] = (byAction[v.action] || 0) + 1;
        }
        return {
            total: violations.length,
            resolved: violations.filter(v => v.resolved).length,
            unresolved: violations.filter(v => !v.resolved).length,
            byAgent,
            byAction,
        };
    }
    /**
     * Clear all violations
     */
    clear() {
        this.violations.clear();
        console.log('[ViolationTracker] Cleared all violations');
    }
    /**
     * Prune old violations when limit is reached
     */
    prune() {
        const sorted = Array.from(this.violations.values())
            .sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = sorted.slice(0, Math.floor(this.maxViolations * 0.2));
        for (const v of toRemove) {
            this.violations.delete(v.id);
        }
    }
    /**
     * Get count
     */
    count() {
        return this.violations.size;
    }
    /**
     * Export violations as JSON
     */
    export() {
        return JSON.stringify(Array.from(this.violations.values()), null, 2);
    }
    /**
     * Import violations from JSON
     */
    import(json) {
        const violations = JSON.parse(json);
        for (const v of violations) {
            this.violations.set(v.id, v);
        }
    }
}
exports.ViolationTracker = ViolationTracker;
function createViolationTracker(maxViolations) {
    return new ViolationTracker(maxViolations);
}
//# sourceMappingURL=violations.js.map