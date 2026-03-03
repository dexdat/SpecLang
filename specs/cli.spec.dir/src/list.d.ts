/**
 * SPECLANG-GENERATED: List command
 * Source: @speclang/mcp.cli
 */
export interface ListOptions {
    tags?: string[];
    layer?: number;
    prefix?: string;
    json?: boolean;
    quiet?: boolean;
}
/**
 * List command implementation
 */
export declare function listCommand(options: ListOptions): Promise<void>;
export default listCommand;
//# sourceMappingURL=list.d.ts.map