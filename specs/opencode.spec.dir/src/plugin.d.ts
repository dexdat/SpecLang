/**
 * Speclang OpenCode Plugin
 *
 * Plugin for OpenCode that provides:
 * - File watching and event handling
 * - Spec header parsing and indexing
 * - Ownership enforcement
 * - Convergence detection
 * - Pipeline execution
 * - Git integration
 *
 * Generated from: @speclang/opencode/integration
 */
import { type OpenCodePluginContext, type SpecHeader } from './types';
export interface PluginOptions {
    projectDir?: string;
}
export declare function SpeclangPlugin(context: OpenCodePluginContext, options?: PluginOptions): Promise<void>;
declare function isSpecFile(filePath: string): boolean;
declare function parseHeader(filePath: string): SpecHeader | null;
export declare function cleanup(): void;
export { parseHeader, isSpecFile };
//# sourceMappingURL=plugin.d.ts.map