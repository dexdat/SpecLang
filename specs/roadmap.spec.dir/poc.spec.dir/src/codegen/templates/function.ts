/**
 * SPECLANG-GENERATED - Do not edit directly
 *
 * Source: specs/roadmap.spec.dir/poc.spec.dir/templates.spec.md
 * Generated: 2026-03-03T05:12:00.000Z
 *
 * Edit the spec, not this file.
 */

import { BlockData, Template } from '../../types/poc';

/**
 * Function template for generating TypeScript functions from spec blocks.
 * 
 * @param data - Block data containing function details
 * @returns Generated TypeScript function code
 */
export const functionTemplate: Template = (data: BlockData): string => {
  const params = data.parameters
    .map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
    .join(', ');
  
  const paramDocs = data.parameters
    .map(p => ` * @param ${p.name} - ${p.description}`)
    .join('\n');
  
  const returnType = data.returns?.type || 'void';
  const returnDoc = data.returns?.description || 'void';
  
  return `/**
 * ${data.description}
${paramDocs}
 * @returns ${returnDoc}
 */
export function ${data.id}(${params}): ${returnType} {
  // TODO: Implement
  throw new Error('Not implemented: ${data.id}');
}`;
};