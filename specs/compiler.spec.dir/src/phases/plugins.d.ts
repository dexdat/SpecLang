/**
 * SPECLANG-GENERATED: Plugin System
 * Source: @speclang/compiler.spec.dir/phases @compiler/plugin-api @compiler/builtin-plugins
 */
import { type CompilerPlugin } from './types';
import type { SpecGraph, ValidationResult, IR, Artifact } from './types';
import type { CompilerTarget } from '../targets';
export declare function registerPlugin(plugin: CompilerPlugin): void;
export declare function unregisterPlugin(name: string): void;
export declare function getPlugins(): CompilerPlugin[];
export declare function runBeforeParse(source: string): string;
export declare function runAfterParse(graph: SpecGraph): SpecGraph;
export declare function runBeforeValidate(graph: SpecGraph): SpecGraph;
export declare function runAfterValidate(result: ValidationResult): ValidationResult;
export declare function runBeforeTransform(ir: IR): IR;
export declare function runBeforeCodegen(ir: IR, target: CompilerTarget): IR;
export declare function runAfterCodegen(artifacts: Artifact[]): Artifact[];
export declare const mermaidValidator: CompilerPlugin;
export declare const refResolver: CompilerPlugin;
export declare const layerEnforcer: CompilerPlugin;
export declare function registerBuiltinPlugins(): void;
//# sourceMappingURL=plugins.d.ts.map