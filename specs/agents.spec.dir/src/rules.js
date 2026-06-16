"use strict";
/**
 * Ownership Rules - Default and custom ownership rules
 *
 * Generated from: @speclang/agent-protocol @block:default_rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORCHESTRATOR_RULE = exports.DEFAULT_RULES = void 0;
exports.isExemptFromGuard = isExemptFromGuard;
exports.getAgentPriority = getAgentPriority;
exports.validateRules = validateRules;
exports.createRule = createRule;
exports.mergeRules = mergeRules;
exports.getRulesForAgent = getRulesForAgent;
const types_1 = require("./types");
exports.DEFAULT_RULES = [
    ...types_1.DEFAULT_OWNERSHIP_RULES,
];
exports.ORCHESTRATOR_RULE = {
    agent: 'north-star',
    patterns: ['project.scl'],
    priority: 100,
};
const AGENT_PRIORITIES = {
    'north-star': 100,
    'spec-writer': 50,
    'code-gen': 40,
    'test-writer': 30,
    'back-sync': 20,
    'pipeline': 10,
};
const EXEMPT_ROLES = new Set(['pipeline']);
function isExemptFromGuard(role) {
    return EXEMPT_ROLES.has(role);
}
function getAgentPriority(role) {
    return AGENT_PRIORITIES[role] || 0;
}
function validateRules(rules) {
    const conflicts = [];
    const patternMap = new Map();
    for (const rule of rules) {
        for (const pattern of rule.patterns) {
            if (!patternMap.has(pattern)) {
                patternMap.set(pattern, []);
            }
            patternMap.get(pattern).push({ agent: rule.agent, priority: rule.priority });
        }
    }
    for (const [pattern, agents] of patternMap) {
        if (agents.length > 1) {
            const sorted = [...agents].sort((a, b) => b.priority - a.priority);
            if (sorted[0].priority === sorted[1].priority) {
                conflicts.push(`Pattern "${pattern}" has conflicting rules with same priority: ${sorted.map(a => a.agent).join(', ')}`);
            }
        }
    }
    return {
        valid: conflicts.length === 0,
        conflicts,
    };
}
function createRule(agent, patterns, priority) {
    return {
        agent,
        patterns,
        priority: priority ?? getAgentPriority(agent),
    };
}
function mergeRules(existing, newRules) {
    const ruleMap = new Map();
    for (const rule of existing) {
        ruleMap.set(rule.agent, rule);
    }
    for (const rule of newRules) {
        const existingRule = ruleMap.get(rule.agent);
        if (existingRule) {
            existingRule.patterns = [...new Set([...existingRule.patterns, ...rule.patterns])];
            existingRule.priority = Math.max(existingRule.priority, rule.priority);
        }
        else {
            ruleMap.set(rule.agent, rule);
        }
    }
    return Array.from(ruleMap.values()).sort((a, b) => b.priority - a.priority);
}
function getRulesForAgent(rules, agent) {
    return rules.find(r => r.agent === agent);
}
//# sourceMappingURL=rules.js.map