/**
 * Gitignore pattern matching for file watching
 *
 * Generated from: @speclang/daemon/events
 *
 * Supports:
 * - Standard .gitignore patterns
 * - Negation patterns (!prefix)
 * - Directory patterns (ending with /)
 * - Wildcard patterns (* and **)
 */
export declare class Gitignore {
    private patterns;
    private negatedPatterns;
    constructor();
    /**
     * Create Gitignore from file path
     */
    static fromFile(filePath: string): Promise<Gitignore>;
    /**
     * Create Gitignore from string content
     */
    static fromContent(content: string): Gitignore;
    /**
     * Add a pattern
     */
    add(pattern: string): Gitignore;
    /**
     * Check if a path should be ignored
     */
    isIgnored(filePath: string): boolean;
    /**
     * Check if path is explicitly negated
     */
    private isNegated;
    /**
     * Convert gitignore pattern to regex
     */
    private patternToRegex;
}
//# sourceMappingURL=gitignore.d.ts.map