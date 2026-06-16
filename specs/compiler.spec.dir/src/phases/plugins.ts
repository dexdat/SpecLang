/**
 * SPECLANG-GENERATED: Plugin System
 * Source: @speclang/compiler.spec.dir/phases @compiler/plugin-api @compiler/builtin-plugins
 */

import { CompileError, type CompilerPlugin } from './types';
import type { SpecGraph, ValidationResult, IR, Artifact } from './types';
import type { CompilerTarget } from '../targets';

const registeredPlugins: CompilerPlugin[] = [];

export function registerPlugin(plugin: CompilerPlugin): void {
  if (registeredPlugins.some((p) => p.name === plugin.name)) {
    throw new Error(`Plugin ${plugin.name} is already registered`);
  }
  registeredPlugins.push(plugin);
}

export function unregisterPlugin(name: string): void {
  const idx = registeredPlugins.findIndex((p) => p.name === name);
  if (idx !== -1) {
    registeredPlugins.splice(idx, 1);
  }
}

export function getPlugins(): CompilerPlugin[] {
  return [...registeredPlugins];
}

export function runBeforeParse(source: string): string {
  let result = source;
  for (const plugin of registeredPlugins) {
    if (plugin.beforeParse) {
      result = plugin.beforeParse(result);
    }
  }
  return result;
}

export function runAfterParse(graph: SpecGraph): SpecGraph {
  let result = graph;
  for (const plugin of registeredPlugins) {
    if (plugin.afterParse) {
      result = plugin.afterParse(result);
    }
  }
  return result;
}

export function runBeforeValidate(graph: SpecGraph): SpecGraph {
  let result = graph;
  for (const plugin of registeredPlugins) {
    if (plugin.beforeValidate) {
      result = plugin.beforeValidate(result);
    }
  }
  return result;
}

export function runAfterValidate(result: ValidationResult): ValidationResult {
  let final = result;
  for (const plugin of registeredPlugins) {
    if (plugin.afterValidate) {
      final = plugin.afterValidate(final);
    }
  }
  return final;
}

export function runBeforeTransform(ir: IR): IR {
  let result = ir;
  for (const plugin of registeredPlugins) {
    if (plugin.beforeTransform) {
      result = plugin.beforeTransform(result);
    }
  }
  return result;
}

export function runBeforeCodegen(ir: IR, target: CompilerTarget): IR {
  let result = ir;
  for (const plugin of registeredPlugins) {
    if (plugin.beforeCodegen) {
      result = plugin.beforeCodegen(result, target);
    }
  }
  return result;
}

export function runAfterCodegen(artifacts: Artifact[]): Artifact[] {
  let result = artifacts;
  for (const plugin of registeredPlugins) {
    if (plugin.afterCodegen) {
      result = plugin.afterCodegen(result);
    }
  }
  return result;
}

export const mermaidValidator: CompilerPlugin = {
  name: 'mermaid-validator',
  version: '1.0.0',
  afterParse(graph: SpecGraph): SpecGraph {
    for (const block of graph.nodes) {
      if (block.kind === 'diagram' && block.content.includes('```mermaid')) {
        const valid = validateMermaidSyntax(block.content);
        if (!valid) {
          graph.errors.push({
            code: 'E005',
            message: `Invalid mermaid syntax in block ${block.id}`,
            location: { file: '', line: block.line, column: 1 },
            block: block.id,
          } as CompileError);
        }
      }
    }
    return graph;
  },
};

export const refResolver: CompilerPlugin = {
  name: 'ref-resolver',
  version: '1.0.0',
  afterParse(graph: SpecGraph): SpecGraph {
    const blockIds = new Set(graph.nodes.map((b) => b.id));
    
    for (const ref of graph.edges) {
      const target = ref.ref.includes('#') ? ref.ref.split('#')[1] : ref.ref;
      
      if (!blockIds.has(target)) {
        graph.errors.push({
          code: 'E004',
          message: `Unresolved reference: ${ref.ref}`,
          location: { file: ref.sourceFile || '', line: ref.line || 0, column: 1 },
        } as CompileError);
      }
    }
    
    return graph;
  },
};

export const layerEnforcer: CompilerPlugin = {
  name: 'layer-enforcer',
  version: '1.0.0',
  afterValidate(result: ValidationResult): ValidationResult {
    for (const header of Object.values(result.errors)) {
      if (header.message.includes('Missing layer')) {
        result.warnings.push({
          code: 'W001',
          message: 'Consider adding layer for better organization',
        });
      }
    }
    return result;
  },
};

export function registerBuiltinPlugins(): void {
  registerPlugin(mermaidValidator);
  registerPlugin(refResolver);
  registerPlugin(layerEnforcer);
}

function validateMermaidSyntax(content: string): boolean {
  const diagramMatch = content.match(/```mermaid\s*(\w+)?\s*([\s\S]*?)```/);
  if (!diagramMatch) return false;

  const diagramType = diagramMatch[1];
  const diagramContent = diagramMatch[2] || '';

  const validTypes = ['flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'mindmap', 'journey'];
  
  if (!validTypes.includes(diagramType)) {
    return false;
  }

  return diagramContent.trim().length > 0;
}
