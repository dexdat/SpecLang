import { ConsistencyCheck, ConsistencyReport, FixReport } from "./types.js";
/**
 * SelfConsistencyValidator - Verify that specs match generated code
 *
 * This validator ensures that the self-specifying system maintains
 * consistency between spec files and their corresponding code.
 */
export declare class SelfConsistencyValidator {
    private projectRoot;
    private strictMode;
    constructor(projectRoot?: string, strictMode?: boolean);
    /**
     * Validate all specs in the project
     */
    validateAll(): Promise<ConsistencyReport>;
    /**
     * Validate a specific spec file
     */
    validateSpec(specPath: string): Promise<ConsistencyCheck>;
    /**
     * Fix inconsistencies automatically where possible
     */
    fixInconsistencies(): Promise<FixReport>;
    /**
     * Check if the system is self-specifying
     */
    checkSelfSpecifying(): Promise<{
        isSelfSpecifying: boolean;
        details: string[];
    }>;
    private findSpecFiles;
    private validateHeader;
    private validateBlocks;
    private validateCodeMatch;
    private fixIssue;
    private codePathForSpec;
    private resolveRefPath;
}
export default SelfConsistencyValidator;
//# sourceMappingURL=validator.d.ts.map