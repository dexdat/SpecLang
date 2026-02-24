/**
 * SPECLANG-GENERATED: Target registry for codegen
 * Source: @speclang/codegen @block:targets
 */

import type { ITargetGenerator, TargetLanguage, CodeSpec, GeneratedFile } from '../types';
import { TypeScriptGenerator } from './typescript';
import { GoGenerator } from './go';
import { PythonGenerator } from './python';
import { RustGenerator } from './rust';

// ============================================================================
// TARGET REGISTRY
// ============================================================================

/** Registry of all target generators */
class TargetRegistry {
  private generators: Map<TargetLanguage, ITargetGenerator> = new Map();
  
  constructor() {
    // Register all built-in generators
    this.register(new TypeScriptGenerator());
    this.register(new GoGenerator());
    this.register(new PythonGenerator());
    this.register(new RustGenerator());
  }
  
  /** Register a target generator */
  register(generator: ITargetGenerator): void {
    this.generators.set(generator.language, generator);
  }
  
  /** Get generator for target language */
  get(target: TargetLanguage): ITargetGenerator | undefined {
    return this.generators.get(target);
  }
  
  /** Check if target is supported */
  has(target: TargetLanguage): boolean {
    return this.generators.has(target);
  }
  
  /** Get all supported targets */
  supportedTargets(): TargetLanguage[] {
    return Array.from(this.generators.keys());
  }
  
  /** Get generators map for internal use */
  getGenerators(): Map<TargetLanguage, ITargetGenerator> {
    return this.generators;
  }
  
  /** Generate code for a spec using appropriate target */
  generate(spec: CodeSpec): GeneratedFile[] {
    const generator = this.get(spec.target.language);
    if (!generator) {
      throw new Error(`Unsupported target: ${spec.target.language}`);
    }
    return generator.generate(spec);
  }
}

// Global registry instance
export const targetRegistry = new TargetRegistry();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/** Generate code for a spec */
export function generateForSpec(spec: CodeSpec): GeneratedFile[] {
  return targetRegistry.generate(spec);
}

/** Get generator for target language */
export function getGenerator(target: TargetLanguage): ITargetGenerator | undefined {
  return targetRegistry.get(target);
}

/** Check if target is supported */
export function isTargetSupported(target: string): target is TargetLanguage {
  return targetRegistry.has(target as TargetLanguage);
}

/** Get list of supported targets */
export function getSupportedTargets(): TargetLanguage[] {
  return targetRegistry.supportedTargets();
}

/** Get all target generators */
export function getAllGenerators(): ITargetGenerator[] {
  return Array.from(targetRegistry.getGenerators().values());
}

// Export ITargetGenerator type
export type { ITargetGenerator } from '../types';
