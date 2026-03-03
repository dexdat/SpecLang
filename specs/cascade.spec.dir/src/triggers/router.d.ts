import { Trigger, RoutingResult, AgentRegistry, TriggerPriority } from './types';
/**
 * Trigger router - determines which agents should respond to a trigger
 */
export declare class TriggerRouter {
    private agentRegistry;
    constructor(agentRegistry: AgentRegistry);
    /**
     * Route a trigger to the appropriate agents
     */
    route(trigger: Trigger): RoutingResult;
    /**
     * Determine which agents should handle this trigger
     */
    private determineAgents;
    /**
     * Check if file is a spec file
     */
    private isSpecFile;
    /**
     * Check if file is a generated file
     */
    private isGeneratedFile;
    /**
     * Check if file is a test file
     */
    private isTestFile;
    /**
     * Get priority for a trigger
     */
    getPriority(trigger: Trigger): TriggerPriority;
    /**
     * Check if trigger starts a new cascade
     */
    startsCascade(trigger: Trigger): boolean;
}
/**
 * Create a simple in-memory agent registry for testing
 */
export declare class InMemoryAgentRegistry implements AgentRegistry {
    private agents;
    constructor(agents?: AgentInfo[]);
    getAgentsForFile(filePath: string): string[];
    getAgentByName(name: string): AgentInfo | null;
    listAgents(): AgentInfo[];
    registerAgent(agent: AgentInfo): void;
}
import { AgentInfo } from './types';
//# sourceMappingURL=router.d.ts.map