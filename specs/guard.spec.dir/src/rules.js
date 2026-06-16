"use strict";
/**
 * Ownership Rules for Guard System
 *
 * SPECLANG-GENERATED
 * Generated from: @speclang/agent-protocol/ownership
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORCHESTRATOR_RULE = exports.DEFAULT_RULES = void 0;
exports.isExemptFromGuard = isExemptFromGuard;
exports.getAgentPriority = getAgentPriority;
exports.validateRules = validateRules;
/**
 * Default ownership rules - defines which agent owns which files
 * Higher priority wins when there are conflicts
 */
exports.DEFAULT_RULES = [
    {
        agent: 'north-star',
        patterns: [
            'project.scl',
            'docs/NORTH_STAR.md',
            '.speclang/project.yaml',
            'SPEC.md'
        ],
        priority: 100,
        description: 'North star owns project definition and top-level config'
    },
    {
        agent: 'spec-writer',
        patterns: [
            'specs/**/*.spec.md',
            'specs/**/*.spec.yaml',
            'specs/**/*.scl',
            'specs/**/*.spec'
        ],
        priority: 50,
        description: 'Spec writer owns all spec files'
    },
    {
        agent: 'code-gen',
        patterns: [
            'src/**/*.ts',
            'src/**/*.js',
            'src/**/*.go',
            'src/**/*.py',
            'src/**/*.rs',
            'src/**/*.java',
            'generated/**/*.ts',
            'generated/**/*.js',
            'generated/**/*.go',
            'generated/**/*.py',
            'generated/**/*.rs'
        ],
        priority: 40,
        description: 'Code gen owns generated source code'
    },
    {
        agent: 'test-writer',
        patterns: [
            'tests/**/*.test.ts',
            'tests/**/*.test.js',
            'tests/**/*.spec.ts',
            'tests/**/*.spec.js',
            'tests/**/*.test.spec.ts'
        ],
        priority: 30,
        description: 'Test writer owns test files'
    },
    {
        agent: 'back-sync',
        patterns: [
            'generated/**/*',
            'src-backup/**/*'
        ],
        priority: 20,
        description: 'Back sync owns backup and generated directories'
    }
];
/**
 * Orchestrator rule - allows orchestrator to override any rule
 * This is a catch-all rule with highest priority
 */
exports.ORCHESTRATOR_RULE = {
    agent: 'north-star', // Using north-star as fallback, orchestrator is special
    patterns: ['**/*'],
    priority: 1000,
    description: 'Orchestrator can override any rule (handled specially)'
};
/**
 * Check if an agent role is exempt from guard enforcement
 */
function isExemptFromGuard(role) {
    // Orchestrator (north-star in some contexts) is exempt
    return role === 'north-star';
}
/**
 * Get the priority for an agent role
 */
function getAgentPriority(role) {
    const rule = exports.DEFAULT_RULES.find(r => r.agent === role);
    return rule?.priority ?? 0;
}
/**
 * Validate ownership rules for conflicts
 */
function validateRules(rules) {
    const conflicts = [];
    // Check for duplicate agents
    const agentCounts = new Map();
    for (const rule of rules) {
        const count = agentCounts.get(rule.agent) || 0;
        agentCounts.set(rule.agent, count + 1);
    }
    for (const entry of Array.from(agentCounts.entries())) {
        const agent = entry[0];
        const count = entry[1];
        if (count > 1) {
            conflicts.push(`Agent ${agent} has ${count} rules defined`);
        }
    }
    // Check for conflicting patterns (same file matched by multiple agents)
    const patternAgents = new Map();
    for (const rule of rules) {
        for (const pattern of rule.patterns) {
            const agents = patternAgents.get(pattern) || [];
            agents.push(rule.agent);
            patternAgents.set(pattern, agents);
        }
    }
    for (const entry of Array.from(patternAgents.entries())) {
        const pattern = entry[0];
        const agents = entry[1];
        if (agents.length > 1) {
            conflicts.push(`Pattern "${pattern}" is claimed by multiple agents: ${agents.join(', ')}`);
        }
    }
    return {
        valid: conflicts.length === 0,
        conflicts
    };
}
//# sourceMappingURL=rules.js.map