import { TestSpec, SupportedLanguage } from './types';
/**
 * TestGenerator converts TestSpec objects to executable test code
 * in various programming languages.
 */
export declare class TestGenerator {
    /**
     * Generate test code for a given test spec and target language
     */
    generate(testSpec: TestSpec, language: SupportedLanguage): string;
    /**
     * Generate TypeScript test code using bun:test
     */
    private generateTypeScript;
    /**
     * Generate a standard (non-parameterized) test case
     */
    private generateStandardTest;
    /**
     * Generate a parameterized test case using examples table
     */
    private generateParameterizedTest;
    /**
     * Translate natural language Given to setup code
     */
    private translateGiven;
    /**
     * Translate natural language When to action code
     */
    private translateWhen;
    /**
     * Translate natural language Then to assertion code
     */
    private translateThen;
    /**
     * Format a value for TypeScript code
     */
    private formatValue;
    /**
     * Format spec for describe block - use short name if available
     */
    private formatDescribe;
    /**
     * Get target module name from spec reference
     */
    getTargetModule(target: string): string;
    /**
     * Get target path from spec reference
     */
    getTargetPath(target: string): string;
    /**
     * Generate Python test code
     */
    private generatePython;
    private generatePythonStandardTest;
    private generatePythonParameterizedTest;
    private formatClassName;
    /**
     * Generate Go test code
     */
    private generateGo;
    private generateGoTest;
}
/**
 * Generate test code from a test spec file
 */
export declare function generateTestCode(specPath: string, language?: SupportedLanguage): Promise<string>;
//# sourceMappingURL=generator.d.ts.map