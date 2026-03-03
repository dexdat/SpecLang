/**
 * SPECLANG-GENERATED: Validation CLI
 * Source: @speclang/validation/cli
 */
export interface ValidateOptions {
    files: string[];
    projectDir: string;
    strict?: boolean;
    verbose?: boolean;
    format?: 'text' | 'json' | 'minimal';
}
export interface ValidateResult {
    success: boolean;
    totalFiles: number;
    passedFiles: number;
    failedFiles: number;
    errors: number;
    warnings: number;
    reports?: any[];
}
export declare function validateCommand(options: ValidateOptions): Promise<ValidateResult>;
export default validateCommand;
//# sourceMappingURL=cli.d.ts.map