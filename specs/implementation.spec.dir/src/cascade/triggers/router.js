"use strict";
// SPECLANG-GENERATED: @speclang/cascade/triggers
// Trigger routing logic - determines which agents to invoke
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAgentRegistry = exports.TriggerRouter = void 0;
const sources_1 = require("./sources");
/**
 * Trigger router - determines which agents should respond to a trigger
 */
class TriggerRouter {
    agentRegistry;
    constructor(agentRegistry) {
        this.agentRegistry = agentRegistry;
    }
    /**
     * Route a trigger to the appropriate agents
     */
    route(trigger) {
        const sourceConfig = (0, sources_1.identifyTriggerSource)(trigger.file);
        if (!sourceConfig) {
            return {
                agents: [],
                priority: 'low',
                starts_cascade: false
            };
        }
        // Determine target agents
        const agents = this.determineAgents(trigger, sourceConfig);
        return {
            agents,
            priority: sourceConfig.priority,
            starts_cascade: sourceConfig.starts_cascade || false
        };
    }
    /**
     * Determine which agents should handle this trigger
     */
    determineAgents(trigger, config) {
        // Use configured triggers if available
        if (config.triggers && config.triggers.length > 0) {
            return config.triggers;
        }
        // Dynamic routing based on file type and content
        if (this.isSpecFile(trigger.file)) {
            return ['speclang-spec-writer', 'speclang-code-gen'];
        }
        if (this.isGeneratedFile(trigger.file)) {
            return ['speclang-test-writer'];
        }
        if (this.isTestFile(trigger.file)) {
            return ['speclang-test-runner'];
        }
        // Fallback: query registry for agents that own similar files
        return this.agentRegistry.getAgentsForFile(trigger.file);
    }
    /**
     * Check if file is a spec file
     */
    isSpecFile(filePath) {
        return (filePath.endsWith('.scl') ||
            filePath.includes('.spec.') ||
            filePath.endsWith('.spec.md') ||
            filePath.endsWith('.spec.yaml') ||
            filePath.endsWith('.spec.yml'));
    }
    /**
     * Check if file is a generated file
     */
    isGeneratedFile(filePath) {
        return filePath.startsWith('generated/');
    }
    /**
     * Check if file is a test file
     */
    isTestFile(filePath) {
        return (filePath.startsWith('tests/') ||
            filePath.includes('_test.') ||
            filePath.includes('.test.') ||
            filePath.includes('.spec.scl') && filePath.includes('test'));
    }
    /**
     * Get priority for a trigger
     */
    getPriority(trigger) {
        const config = (0, sources_1.identifyTriggerSource)(trigger.file);
        return config?.priority || 'low';
    }
    /**
     * Check if trigger starts a new cascade
     */
    startsCascade(trigger) {
        const config = (0, sources_1.identifyTriggerSource)(trigger.file);
        return config?.starts_cascade || false;
    }
}
exports.TriggerRouter = TriggerRouter;
/**
 * Create a simple in-memory agent registry for testing
 */
class InMemoryAgentRegistry {
    agents = new Map();
    constructor(agents = []) {
        for (const agent of agents) {
            this.agents.set(agent.name, agent);
        }
    }
    getAgentsForFile(filePath) {
        const matching = [];
        this.agents.forEach((agent, name) => {
            for (const pattern of agent.owned_files) {
                if ((0, sources_1.matchPattern)(filePath, pattern)) {
                    matching.push(name);
                    break;
                }
            }
        });
        return matching;
    }
    getAgentByName(name) {
        return this.agents.get(name) || null;
    }
    listAgents() {
        return Array.from(this.agents.values());
    }
    registerAgent(agent) {
        this.agents.set(agent.name, agent);
    }
}
exports.InMemoryAgentRegistry = InMemoryAgentRegistry;
/**
 * Simple glob matching for registry
 */
function matchGlob(filePath, pattern) {
    if (pattern === '**/*')
        return true;
    if (pattern.endsWith('/**')) {
        const prefix = pattern.slice(0, -3);
        return filePath.startsWith(prefix);
    }
    if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        return regex.test(filePath);
    }
    return filePath === pattern;
}
//# sourceMappingURL=router.js.map