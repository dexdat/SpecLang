/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/templates.spec.md
 * Generated: 2026-03-03T05:15:00.000Z
 *
 * Edit the spec, not this file.
 */

import { BlockData, Template } from '../../types/poc';

/**
 * Class template for generating TypeScript classes from spec blocks.
 * 
 * @param data - Block data containing class details
 * @returns Generated TypeScript class code
 */
export const classTemplate: Template = (data: BlockData): string => {
  const properties = data.properties
    ?.map(p => `  ${p.name}${p.optional ? '?' : ''}: ${p.type};  // ${p.description}`)
    .join('\n') || '';
  
  return `/**
 * ${data.description}
 */
export class ${data.id} {
${properties}
  // TODO: Implement
  constructor() {
    throw new Error('Not implemented: ${data.id}');
  }
}`;
};