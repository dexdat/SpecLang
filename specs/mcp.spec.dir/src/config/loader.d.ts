import { MCPConfig } from './types';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class ConfigLoader {
    private configPath;
    constructor(configPath?: string);
    getConfigPath(): string;
    private findConfigFile;
    load(): MCPConfig;
    private mergeWithDefaults;
    save(config: MCPConfig): void;
    validate(config: MCPConfig): ValidationResult;
}
export declare function applyEnvOverrides(config: MCPConfig): MCPConfig;
//# sourceMappingURL=loader.d.ts.map