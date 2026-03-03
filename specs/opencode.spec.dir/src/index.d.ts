/**
 * OpenCode Integration Module
 *
 * SpecLang's OpenCode plugin for reactive spec-driven development.
 *
 * @module speclang/opencode
 */
export * from './types';
export * from './config';
export * from './plugin';
import { SpeclangPlugin, type PluginOptions } from './plugin';
import { loadConfig, getProfile, type SpeclangRC } from './config';
import type { OpenCodePluginContext } from './types';
export { SpeclangPlugin, loadConfig, getProfile };
export type { SpeclangRC, PluginOptions, OpenCodePluginContext };
/**
 * Create and configure the Speclang plugin
 */
export declare function createPlugin(context: OpenCodePluginContext, options?: PluginOptions): Promise<void>;
/**
 * Default plugin factory for OpenCode
 */
export declare function plugin(context: OpenCodePluginContext): () => Promise<void>;
//# sourceMappingURL=index.d.ts.map