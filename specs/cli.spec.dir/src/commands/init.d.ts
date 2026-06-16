/**
 * SPECLANG-GENERATED: Init command
 * Source: @speclang/mcp.cli
 */
export interface InitOptions {
    name?: string;
    targetDir?: string;
    initGit?: boolean;
    force?: boolean;
    targets?: string[];
    description?: string;
    version?: string;
    json?: boolean;
}
/**
 * Init command implementation
 */
export declare function initCommand(options: InitOptions): Promise<void>;
export default initCommand;
//# sourceMappingURL=init.d.ts.map