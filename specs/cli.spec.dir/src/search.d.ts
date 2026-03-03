/**
 * SPECLANG-GENERATED: Search command
 * Source: @speclang/mcp.cli
 */
export interface SearchOptions {
    tags?: string[];
    layer?: number;
    limit?: number;
    json?: boolean;
    quiet?: boolean;
}
/**
 * Search command implementation
 */
export declare function searchCommand(query: string, options: SearchOptions): Promise<void>;
export default searchCommand;
//# sourceMappingURL=search.d.ts.map