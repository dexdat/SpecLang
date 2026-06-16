/**
 * Configuration management for speclangd
 *
 * Generated from: @speclang/daemon/architecture
 */
import { DaemonConfig } from './types';
export declare class Config {
    private config;
    private configPath;
    constructor(configPath?: string);
    load(): Promise<DaemonConfig>;
    private mergeConfig;
    get(): DaemonConfig;
    getWatchPaths(): string[];
    getIgnorePatterns(): string[];
    getQuietPeriod(): number;
    getMaxDepth(): number;
    getLockDir(): string;
    getLockTimeout(): number;
    save(): Promise<void>;
}
export declare function loadConfig(configPath?: string): Promise<Config>;
export declare function getConfig(): Config | null;
//# sourceMappingURL=config.d.ts.map