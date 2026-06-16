import { MaturityLevel, ParsedSpec, CriteriaResult } from './types';
/**
 * Criteria Checker
 *
 * Validates whether a spec meets the criteria for a given
 * maturity level and suggests appropriate levels.
 */
export declare class CriteriaChecker {
    /**
     * Check if a spec meets the criteria for a given level
     */
    checkLevel(spec: ParsedSpec, level: MaturityLevel): CriteriaResult;
    /**
     * Suggest the appropriate level for a spec based on its content
     */
    suggestLevel(spec: ParsedSpec): MaturityLevel;
    /**
     * Get all levels a spec qualifies for
     */
    getQualifiedLevels(spec: ParsedSpec): MaturityLevel[];
    /**
     * Check if spec has a specific field
     */
    private hasField;
    /**
     * Get test coverage from spec
     */
    private getTestCoverage;
    /**
     * Score documentation completeness (0-100)
     */
    scoreDocumentation(spec: ParsedSpec): number;
    /**
     * Get minimum documentation score for a level
     */
    private getMinDocScore;
    /**
     * Score testing completeness (0-100)
     */
    scoreTesting(spec: ParsedSpec): number;
    /**
     * Get minimum testing score for a level
     */
    private getMinTestScore;
}
/**
 * Create a new CriteriaChecker instance
 */
export declare function createCriteriaChecker(): CriteriaChecker;
//# sourceMappingURL=criteria.d.ts.map