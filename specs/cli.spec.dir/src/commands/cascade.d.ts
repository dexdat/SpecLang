/**
 * SPECLANG-GENERATED: Cascade command
 * Source: @speclang/mcp.cli
 */
export interface CascadeOptions {
    json?: boolean;
}
/**
 * Cascade command implementation
 */
export declare function cascadeCommand(action: 'status' | 'trigger' | 'abort', specId: string | undefined, options: CascadeOptions): Promise<void>;
export default cascadeCommand;
//# sourceMappingURL=cascade.d.ts.map