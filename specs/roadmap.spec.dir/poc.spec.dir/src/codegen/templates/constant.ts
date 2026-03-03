/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/template-registry.spec.md
 * Generated: 2026-03-03T05:18:00.000Z
 *
 * Edit the spec, not this file.
 */

import { BlockData, Template } from '../../types/poc';

/**
 * Constant template for generating TypeScript constants from spec blocks.
 * 
 * @param data - Block data containing constant details
 * @returns Generated TypeScript constant code
 */
export const constantTemplate: Template = (data: BlockData): string => {
  const type = data.properties?.[0]?.type || 'any';
  
  return `/**
 * ${data.description}
 */
export const ${data.id}: ${type} = {
  // TODO: Define constant value
};`;
};