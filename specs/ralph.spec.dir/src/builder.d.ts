import { Task, BuilderAgent, BuilderResult, SteeringPacket, BuilderCapability, BuilderTrigger, BuilderOutput } from './types';
/**
 * BuilderAgentConfig - Configuration for the Builder Agent
 */
export interface BuilderAgentConfig {
    specsDir: string;
    srcDir: string;
    outputDir: string;
}
/**
 * RalphBuilderAgent - Implementation of the Builder Agent
 */
export declare class RalphBuilderAgent implements BuilderAgent {
    role: BuilderAgent['role'];
    capabilities: BuilderCapability[];
    triggers: BuilderTrigger[];
    outputs: BuilderOutput[];
    private config;
    constructor(config: BuilderAgentConfig);
    /**
     * Execute a task from the todo list
     */
    executeTask(task: Task): Promise<BuilderResult>;
    /**
     * Process a steering packet and generate fixes
     */
    processSteeringPacket(packet: SteeringPacket): Promise<BuilderResult>;
    /**
     * Fix an error based on error report
     */
    private fixError;
    /**
     * Apply a fix suggestion
     */
    private applyFixSuggestion;
    /**
     * Read all existing specs
     */
    private readAllSpecs;
    /**
     * Generate implementation for a task
     */
    private generateImplementation;
    /**
     * Generate code from implementation
     */
    private generateCode;
    /**
     * Write a spec file
     */
    private writeSpecFile;
    /**
     * Extract import statement from fix suggestion
     */
    private extractImportFromFix;
    /**
     * Apply syntax fix
     */
    private applySyntaxFix;
    /**
     * Get agent info
     */
    getInfo(): BuilderAgent;
}
/**
 * Create a new Builder Agent instance
 */
export declare function createBuilderAgent(config: BuilderAgentConfig): RalphBuilderAgent;
//# sourceMappingURL=builder.d.ts.map