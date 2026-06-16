import { Task, VerifierAgent, VerificationResult, ValidationStage, SteeringPacket, BuilderResult } from './types';
/**
 * VerifierAgentConfig - Configuration for the Verifier Agent
 */
export interface VerifierAgentConfig {
    specsDir: string;
    srcDir: string;
    testDir?: string;
}
/**
 * RalphVerifierAgent - Implementation of the Verifier Agent
 */
export declare class RalphVerifierAgent implements VerifierAgent {
    role: VerifierAgent['role'];
    capabilities: VerifierAgent['capabilities'];
    validation_pipeline: ValidationStage[];
    outputs: VerifierAgent['outputs'];
    private config;
    constructor(config: VerifierAgentConfig);
    /**
     * Run the complete validation pipeline on a task's output
     */
    validate(builderResult: BuilderResult, task: Task): Promise<VerificationResult>;
    /**
     * Run a single validation stage
     */
    private runValidationStage;
    /**
     * Validate spec format
     */
    private validateSpecFormat;
    /**
     * Validate header compliance
     */
    private validateHeaderCompliance;
    /**
     * Validate references
     */
    private validateReferences;
    /**
     * Validate code compilation
     */
    private validateCodeCompilation;
    /**
     * Validate tests
     */
    private validateTests;
    /**
     * Validate integration
     */
    private validateIntegration;
    /**
     * Create a steering packet for a failed validation
     */
    createSteeringPacketForFailure(task: Task, errors: string[]): SteeringPacket;
    /**
     * Create a success confirmation packet
     */
    createSuccessConfirmation(task: Task, builderResult: BuilderResult): SteeringPacket;
    /**
     * Get agent info
     */
    getInfo(): VerifierAgent;
}
/**
 * Create a new Verifier Agent instance
 */
export declare function createVerifierAgent(config: VerifierAgentConfig): RalphVerifierAgent;
//# sourceMappingURL=verifier.d.ts.map