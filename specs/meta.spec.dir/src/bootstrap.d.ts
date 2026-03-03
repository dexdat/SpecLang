import { SpecFile, BootstrapResult, BootstrapPhase, SourceSpecMapping } from "./types.js";
/**
 * MetaBootstrap - The meta-circular bootstrap process
 *
 * This implements the self-specifying system that:
 * 1. Generates specs from existing code
 * 2. Validates self-consistency
 * 3. Generates code from specs
 * 4. Verifies equivalence
 * 5. Commits self-specification
 */
export declare class MetaBootstrap {
    private projectRoot;
    private generator;
    private validator;
    private phases;
    constructor(projectRoot?: string);
    /**
     * Run the full bootstrap sequence
     */
    run(dryRun?: boolean): Promise<BootstrapResult>;
    /**
     * Generate specs from existing code for key modules
     */
    generateSpecsFromCode(): Promise<SpecFile[]>;
    /**
     * Validate self-consistency of the system
     */
    validateSelfConsistency(): Promise<{
        passed: boolean;
        totalSpecs: number;
        failed: number;
        issues: any[];
    }>;
    /**
     * Generate code from specs
     */
    generateCodeFromSpecs(specs: SpecFile[]): Promise<number>;
    /**
     * Verify that generated specs are equivalent to existing ones
     */
    verifyEquivalence(): Promise<{
        verified: boolean;
        differences: string[];
    }>;
    /**
     * Commit the self-specification state
     */
    commitSelfSpecification(): Promise<void>;
    /**
     * Get status of all bootstrap phases
     */
    getPhaseStatus(): BootstrapPhase[];
    /**
     * Get mappings between source code and specs
     */
    getSourceSpecMappings(): Promise<SourceSpecMapping[]>;
    private startPhase;
    private completePhase;
    private failPhase;
    private specPathForSourceDir;
}
export default MetaBootstrap;
//# sourceMappingURL=bootstrap.d.ts.map