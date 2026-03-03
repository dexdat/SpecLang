import { TestReport, SupportedLanguage } from './types';
/**
 * TestRunner executes test specs and collects results
 */
export declare class TestRunner {
    private language;
    constructor(language?: SupportedLanguage);
    /**
     * Run a single test spec file
     */
    runTestSpec(specPath: string): Promise<TestReport>;
    /**
     * Execute tests and parse results
     */
    private executeTests;
    /**
     * Run all test specs in a directory
     */
    runAllTestSpecs(dir: string): Promise<TestReport[]>;
    /**
     * Find all test spec files in a directory
     */
    private findTestSpecs;
    /**
     * Generate test code without running
     */
    generateOnly(specPath: string, outputPath?: string): Promise<string>;
}
/**
 * Run a test spec and return results
 */
export declare function runTestSpec(specPath: string, language?: SupportedLanguage): Promise<TestReport>;
/**
 * Run all test specs in a directory
 */
export declare function runAllTestSpecs(dir: string, language?: SupportedLanguage): Promise<TestReport[]>;
//# sourceMappingURL=runner.d.ts.map