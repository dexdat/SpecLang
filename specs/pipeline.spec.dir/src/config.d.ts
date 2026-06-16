/**
 * Pipeline Configuration Management
 *
 * SPECLANG-GENERATED: @speclang/pipeline
 * Generated from: @speclang/pipeline/build
 */
import { PipelineConfig } from './types';
export declare class PipelineConfigManager {
    private config;
    private configPath;
    constructor(configPath?: string);
    load(): Promise<PipelineConfig>;
    private mergeConfig;
    get(): PipelineConfig;
    getPipelineStages(): import("./types").Stage[];
    getSuccessActions(): string[];
    getRecoveryActions(): import("./types").RecoveryAction[];
    getMaxRecoveryAttempts(): number;
    save(config?: Partial<PipelineConfig>): Promise<void>;
    validate(): {
        valid: boolean;
        errors: string[];
    };
    private hasCircularDependency;
}
export declare function loadPipelineConfig(configPath?: string): Promise<PipelineConfigManager>;
export declare function getPipelineConfig(): PipelineConfigManager | null;
//# sourceMappingURL=config.d.ts.map