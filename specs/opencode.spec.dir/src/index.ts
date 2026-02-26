/**
speclang-header lines:5
id: @specs/opencode
version: 1.0.0
layer: 5
 */

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
export async function createPlugin(
  context: OpenCodePluginContext,
  options?: PluginOptions
): Promise<void> {
  await SpeclangPlugin(context, options);
}

/**
 * Default plugin factory for OpenCode
 */
export function plugin(context: OpenCodePluginContext): () => Promise<void> {
  return () => SpeclangPlugin(context, {});
}
