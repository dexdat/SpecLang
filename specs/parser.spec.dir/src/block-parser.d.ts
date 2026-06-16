import { ParsedBlock, ParsedSpec } from '../../src/types/poc';
/**
 * Parser for spec markdown files
 * Extracts @block: definitions and spec headers
 */
export declare class BlockParser {
    private readonly blockPattern;
    private readonly paramPattern;
    private readonly returnPattern;
    private readonly examplePattern;
    private headerParser;
    constructor();
    /**
     * Allowed spec root directory
     */
    private readonly specRoot;
    /**
     * Parse a spec file with path traversal protection
     * @param filePath - Path to the spec file (must be within specs/)
     * @returns Complete parsed spec with header and blocks
     * @throws {POCError} If file cannot be read, is outside specs/, or parsing fails
     */
    parseFile(filePath: string): Promise<ParsedSpec>;
    /**
     * Validate file path for security
     * - Resolves symlinks with realpath
     * - Checks path is within specRoot
     * - Normalizes path separators
     * - Verifies file exists and is readable
     */
    private validateFilePath;
    /**
     * Parse spec content
     * @param content - Raw markdown content
     * @param filePath - Source file path (for metadata)
     * @returns Complete parsed spec
     */
    parse(content: string, filePath: string): ParsedSpec;
    /**
     * Parse all blocks from content
     * @param content - Markdown content
     * @param filePath - Source file path (for error reporting)
     * @returns Array of parsed blocks
     */
    parseBlocks(content: string, filePath: string): ParsedBlock[];
    /**
     * Parse a single block
     * @param match - RegExp match array from block pattern
     * @param fullContent - Full file content
     * @returns Parsed block
     */
    private parseBlock;
    /**
     * Extract section content until next block or EOF
     */
    private extractSection;
    /**
     * Parse block description (text after header, before params)
     */
    private parseDescription;
    /**
     * Parse parameters section
     * Handles: "name: string - description", "name?: string - optional param"
     */
    private parseParameters;
    /**
     * Parse properties section (for classes/interfaces)
     * Handles: "name: type - description"
     */
    private parseProperties;
    /**
     * Parse return type
     */
    private parseReturns;
    /**
     * Parse code examples
     */
    private parseExamples;
}
//# sourceMappingURL=block-parser.d.ts.map