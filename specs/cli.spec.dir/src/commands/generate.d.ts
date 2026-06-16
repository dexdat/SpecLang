/**
 * SPECLANG-GENERATED: Generate command
 * Source: @speclang/mcp.cli
 */
export interface GenerateOptions {
    target?: 'typescript' | 'go' | 'python';
    outputDir?: string;
    dryRun?: boolean;
    json?: boolean;
}
/**
 * Generate command implementation
 */
export declare function generateCommand(options: GenerateOptions): Promise<void>;
export default generateCommand;
//# sourceMappingURL=generate.d.ts.map