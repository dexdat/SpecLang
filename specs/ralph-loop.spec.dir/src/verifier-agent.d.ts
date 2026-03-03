import { Task, VerificationResult, DatabaseInstance } from './types';
/**
 * VerifierAgent - Responsible for validating specs and generated code
 *
 * Part of the Ralph Loop dual-agent system, the VerifierAgent validates
 * the output from the BuilderAgent by checking spec format, code compilation,
 * and reference integrity.
 */
export declare class VerifierAgent {
    private db;
    constructor(db: DatabaseInstance);
    /**
     * Validate the output from BuilderAgent
     * @param task The original task
     * @param output The output from BuilderAgent
     * @returns Verification result with success status and errors
     */
    validate(task: Task, output: any): Promise<VerificationResult>;
    /**
     * Validate a spec file for proper format
     * @param specPath Path to the spec file
     * @returns Array of validation errors
     */
    private validateSpec;
    /**
     * Validate code files by attempting compilation
     * @param codeFiles Array of code file paths
     * @returns Array of compilation errors
     */
    private validateCode;
    /**
     * Validate that all @ref:... point to existing IDs in SQLite
     * @returns Array of reference validation errors
     */
    private validateReferences;
}
//# sourceMappingURL=verifier-agent.d.ts.map