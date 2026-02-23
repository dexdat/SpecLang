/**
 * SPECLANG-GENERATED: Reference validation rule
 * Source: @speclang/validation/rules#@validation/refs
 */

import type { ParsedSpec, ValidationRule, ValidationResult, ValidationContext } from '../types';
import { createError, createWarning } from '../types';

/**
 * Reference Validation Rule
 * 
 * Validates references in specs:
 * - Target file must exist
 * - Target block must exist (if specified)
 * - No circular references
 */
export const refsRule: ValidationRule = {
  id: '@validation/refs',
  name: 'Reference Validation',
  level: 'error',

  check(spec: ParsedSpec, context?: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];

    // If no context, we can't validate references fully
    if (!context) {
      // Just validate reference format
      return validateRefFormats(spec);
    }

    // Validate each reference
    for (const ref of spec.references || []) {
      const refResults = validateReference(ref, spec, context);
      results.push(...refResults);
    }

    // Check for circular dependencies
    const cycles = detectCycles(spec, context);
    for (const cycle of cycles) {
      results.push(createError(
        '@validation/refs',
        { file: spec.filepath, line: 'content' },
        `Circular dependency detected: ${cycle.join(' -> ')}`,
        'Remove the circular reference'
      ));
    }

    return results;
  },
};

/**
 * Validate reference format (without file existence check)
 */
function validateRefFormats(spec: ParsedSpec): ValidationResult[] {
  const results: ValidationResult[] = [];
  const refRegex = /^@ref:([a-zA-Z0-9_\-\/.]+)(?:#([a-zA-Z0-9_\-\/]+))?$/;

  for (const ref of spec.references || []) {
    const refStr = ref.ref || ref.toString();
    
    if (!refRegex.test(refStr)) {
      results.push(createError(
        '@validation/refs',
        { file: spec.filepath, line: ref.line || 'content' },
        `Invalid reference format: ${refStr}`,
        'Use format: @ref:path/to/spec or @ref:path/to/spec#block-id'
      ));
    }
  }

  return results;
}

/**
 * Validate a single reference
 */
function validateReference(
  ref: { ref: string; targetFile?: string; targetBlock?: string; line?: number },
  spec: ParsedSpec,
  context: ValidationContext
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const refStr = ref.ref || '';

  // Parse reference
  const match = refStr.match(/^@ref:([a-zA-Z0-9_\-\/.]+)(?:#([a-zA-Z0-9_\-\/]+))?$/);
  if (!match) {
    results.push(createError(
      '@validation/refs',
      { file: spec.filepath, line: ref.line || 'content' },
      `Invalid reference format: ${refStr}`,
      'Use format: @ref:path/to/spec or @ref:path/to/spec#block-id'
    ));
    return results;
  }

  const [_full, targetPath, targetBlock] = match;
  const targetFile = ref.targetFile || targetPath;

  // Check if target spec exists
  const targetSpec = context.allSpecs.get(targetFile) || context.allSpecs.get(`${targetFile}.spec`);
  
  if (!targetSpec) {
    // Check via file system
    if (context.fs) {
      const exists = context.fs.exists(`${context.baseDir}/${targetFile}.spec`)
        .catch(() => false);
      
      if (!exists) {
        results.push(createError(
          '@validation/refs',
          { file: spec.filepath, line: ref.line || 'content' },
          `Reference target not found: ${targetFile}`,
          `Create spec file: ${targetFile}.spec`
        ));
      }
    } else {
      results.push(createWarning(
        '@validation/refs',
        { file: spec.filepath, line: ref.line || 'content' },
        `Cannot verify reference target: ${targetFile}`,
        'Ensure target spec exists'
      ));
    }
    return results;
  }

  // Check if target block exists (if specified)
  if (targetBlock) {
    const hasBlock = targetSpec.blocks?.some(b => b.id === targetBlock || b.id === `@block:${targetBlock}`);
    
    if (!hasBlock) {
      results.push(createError(
        '@validation/refs',
        { file: spec.filepath, line: ref.line || 'content' },
        `Block not found in target: ${targetBlock}`,
        `Available blocks in ${targetFile}: ${targetSpec.blocks?.map(b => b.id).join(', ') || 'none'}`
      ));
    }
  }

  return results;
}

/**
 * Detect circular dependencies in references
 */
function detectCycles(spec: ParsedSpec, context: ValidationContext): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(currentId: string, currentPath: string[]): void {
    if (currentPath.includes(currentId)) {
      // Found a cycle
      const cycleStart = currentPath.indexOf(currentId);
      cycles.push([...currentPath.slice(cycleStart), currentId]);
      return;
    }

    if (visited.has(currentId)) {
      return;
    }

    visited.add(currentId);
    path.push(currentId);

    // Get dependencies
    const currentSpec = context.allSpecs.get(currentId);
    if (currentSpec?.metadata?.depends_on) {
      for (const dep of currentSpec.metadata.depends_on) {
        const depId = typeof dep === 'string' ? dep : dep.ref || dep.toString();
        dfs(depId, path);
      }
    }

    path.pop();
  }

  if (spec.metadata.id) {
    dfs(spec.metadata.id, []);
  }

  return cycles;
}

/**
 * Build dependency graph from specs
 */
export function buildDependencyGraph(specs: ParsedSpec[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const spec of specs) {
    const id = spec.metadata.id;
    if (!id) continue;

    const deps: string[] = [];
    
    if (spec.metadata.depends_on) {
      for (const dep of spec.metadata.depends_on) {
        const depId = typeof dep === 'string' ? dep : dep.ref || dep.toString();
        deps.push(depId);
      }
    }

    graph.set(id, deps);
  }

  return graph;
}

export default refsRule;
