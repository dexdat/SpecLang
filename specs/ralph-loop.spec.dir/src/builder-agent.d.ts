import { Task, BuilderResult, DatabaseInstance } from './types';
/**
 * BuilderAgent - Responsible for writing specs and generating code
 *
 * Part of the Ralph Loop dual-agent system, the BuilderAgent executes
 * tasks assigned by the LoopController by writing implementation specs
 * and generating code files.
 */
export declare class BuilderAgent {
    private db;
    constructor(db: DatabaseInstance);
    /**
     * Execute a task assigned by the LoopController
     * @param task The task to execute
     * @returns Result containing output or error
     */
    execute(task: Task): Promise<BuilderResult>;
    /**
     * Load specs from SQLite database
     * @returns Array of spec records with layer >= 3
     */
    private loadSpecs;
    /**
     * Write an implementation spec for the given task
     * @param task The task to write implementation spec for
     * @returns Path to the created spec file
     */
    private writeImplementationSpec;
    /**
     * Generate code files for the given task
     * @param task The task to generate code for
     * @returns Array of generated file paths
     */
    private generateCode;
}
//# sourceMappingURL=builder-agent.d.ts.map