/**
 * OpenCode Plugin Configuration
 *
 * Configuration loading and profile management
 */
import type { OpenCodePluginConfig, BuildProfile, BuildProfileConfig } from './types';
export declare const DEFAULT_CONFIG: OpenCodePluginConfig;
export declare const PROFILES: Record<BuildProfile, BuildProfileConfig>;
export interface SpeclangRC {
    profile?: BuildProfile;
    profiles?: Record<BuildProfile, BuildProfileConfig>;
    models?: Record<string, string>;
    quietPeriod?: number;
    maxConcurrent?: number;
}
export declare function loadConfig(projectDir: string): OpenCodePluginConfig;
export declare function getProfile(profile: BuildProfile): BuildProfileConfig;
export declare function getAllProfiles(): Record<BuildProfile, BuildProfileConfig>;
//# sourceMappingURL=config.d.ts.map