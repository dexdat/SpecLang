export interface MetaCLIOptions {
    dryRun?: boolean;
    verbose?: boolean;
    force?: boolean;
    output?: string;
    json?: boolean;
}
/**
 * Execute meta generate command
 */
export declare function metaGenerateCommand(options: MetaCLIOptions): Promise<void>;
/**
 * Execute meta validate command
 */
export declare function metaValidateCommand(options: MetaCLIOptions): Promise<void>;
/**
 * Execute meta bootstrap command
 */
export declare function metaBootstrapCommand(options: MetaCLIOptions): Promise<void>;
/**
 * Execute meta check command
 */
export declare function metaCheckCommand(options: MetaCLIOptions): Promise<void>;
//# sourceMappingURL=meta.d.ts.map