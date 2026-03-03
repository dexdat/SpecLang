import { TestSpec } from './types';
/**
 * TestSpecParser parses test specs written in natural language
 * and converts them to structured TestSpec objects.
 */
export declare class TestSpecParser {
    /**
     * Parse a test spec content string into a TestSpec object
     */
    parse(content: string): TestSpec;
    /**
     * Parse YAML header from test spec content
     * Supports both standard YAML header and speclang header format
     */
    private parseHeader;
    /**
     * Parse all scenarios from test spec content
     */
    private parseScenarios;
    /**
     * Parse a list of items with a given keyword (e.g., Given, Then)
     */
    private parseList;
    /**
     * Parse a single item with a given keyword (e.g., When)
     */
    private parseSingle;
    /**
     * Parse examples table from markdown format
     * | field1 | field2 |
     * |--------|--------|
     * | value1 | value2 |
     */
    private parseExamples;
}
/**
 * Parse a test spec from a file
 */
export declare function parseTestSpecFile(filepath: string): Promise<TestSpec>;
//# sourceMappingURL=parser.d.ts.map