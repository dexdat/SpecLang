/**
 * Ralph Loop - Main Loop Controller
 *
 * Controls the dual-agent Ralph Loop process:
 * 1. Load complete backing specifications
 * 2. Generate todo list
 * 3. Spawn Builder and Verifier agents
 * 4. While todo list has pending tasks:
 *    a. Get next task
 *    b. Assign task to Builder
 *    c. Builder executes task
 *    d. Verifier validates output
 *    e. If validation succeeds, mark task done
 *    f. If validation fails, create steering packet, send to Builder, retry task
 * 5. When all tasks done, run system verification, final validation, and success report
 *
 * @module ralph/loop
 */
import { TodoList, LoopState, LoopConfig, SteeringPacket, ImplementationPhase } from './types';
import { RalphBuilderAgent, BuilderAgentConfig } from './builder';
import { RalphVerifierAgent, VerifierAgentConfig } from './verifier';
/**
 * RalphLoop - Main controller for the dual-agent Ralph Loop
 */
export declare class RalphLoop {
    private state;
    private config;
    private builder;
    private verifier;
    private steeringPackets;
    private currentPhase;
    constructor(builderConfig: BuilderAgentConfig, verifierConfig: VerifierAgentConfig, config?: Partial<LoopConfig>);
    /**
     * Load complete backing specifications
     */
    loadSpecifications(): Promise<void>;
    /**
     * Generate todo list from spec analysis
     */
    generateTodoList(): Promise<TodoList>;
    /**
     * Run the Ralph Loop
     */
    run(): Promise<void>;
    /**
     * Check if there are pending tasks
     */
    private hasPendingTasks;
    /**
     * Get next pending task
     */
    private getNextTask;
    /**
     * Process next task in the loop
     */
    private processNextTask;
    /**
     * Run system verification when all tasks are done
     */
    private runSystemVerification;
    /**
     * Get current state
     */
    getState(): LoopState;
    /**
     * Get steering packets
     */
    getSteeringPackets(): SteeringPacket[];
    /**
     * Set implementation phase
     */
    setPhase(phase: ImplementationPhase): void;
    /**
     * Stop the loop
     */
    stop(): void;
    /**
     * Get builder agent
     */
    getBuilder(): RalphBuilderAgent;
    /**
     * Get verifier agent
     */
    getVerifier(): RalphVerifierAgent;
}
/**
 * Create a new Ralph Loop instance
 */
export declare function createRalphLoop(builderConfig: BuilderAgentConfig, verifierConfig: VerifierAgentConfig, config?: Partial<LoopConfig>): RalphLoop;
//# sourceMappingURL=loop.d.ts.map