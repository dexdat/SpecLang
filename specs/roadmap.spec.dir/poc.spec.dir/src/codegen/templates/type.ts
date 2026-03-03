/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/template-registry.spec.md
 * Generated: 2026-03-03T05:17:00.000Z
 *
 * Edit the spec, not this file.
 */

import { BlockData, Template } from '../../types/poc';

/**
 * Type alias template for generating TypeScript type aliases from spec blocks.
 * 
 * @param data - Block data containing type details
 * @returns Generated TypeScript type alias code
 */
export const typeTemplate: Template = (data: BlockData): string => {
  return `/**
 * ${data.description}
 */
export type ${data.id} = {
  // TODO: Define type structure
};`;
};