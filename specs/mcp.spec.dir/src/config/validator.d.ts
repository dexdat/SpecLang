import { MCPConfig } from './types';
export interface ValidationError {
    field: string;
    message: string;
}
export interface ConfigValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
}
export declare class ConfigValidator {
    private strict;
    constructor(strict?: boolean);
    validate(config: MCPConfig): ConfigValidationResult;
    private validateServer;
    private validateAuth;
    private validateDatabase;
    private validateLimits;
    private validateStrict;
}
export declare function validateConfig(config: MCPConfig, strict?: boolean): ConfigValidationResult;
//# sourceMappingURL=validator.d.ts.map