/**
 * SPECLANG-GENERATED: Get command
 * Source: @speclang/mcp.cli
 */
export interface GetOptions {
    content?: boolean;
    blocks?: boolean;
    json?: boolean;
    quiet?: boolean;
}
/**
 * Get command implementation
 */
export declare function getCommand(specId: string, options: GetOptions): Promise<void>;
export default getCommand;
//# sourceMappingURL=get.d.ts.map