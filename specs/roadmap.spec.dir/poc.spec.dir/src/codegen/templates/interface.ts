/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/templates.spec.md
 * Generated: 2026-03-03T05:16:00.000Z
 *
 * Edit the spec, not this file.
 */

import { BlockData, Template } from '../../types/poc';

/**
 * Interface template for generating TypeScript interfaces from spec blocks.
 * 
 * @param data - Block data containing interface details
 * @returns Generated TypeScript interface code
 */
export const interfaceTemplate: Template = (data: BlockData): string => {
  const properties = data.properties
    ?.map(p => `  ${p.name}${p.optional ? '?' : ''}: ${p.type};  // ${p.description}`)
    .join('\n') || '';
  
  return `/**
 * ${data.description}
 */
export interface ${data.id} {
${properties}
}`;
};