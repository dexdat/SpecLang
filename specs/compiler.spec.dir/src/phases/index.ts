/**
 * SPECLANG-GENERATED: Compiler Phases Module
 * Source: @speclang/compiler.spec.dir/phases
 */

export * from './types';
export * from './errors';
export { parse, parsePhase } from './parse';
export { validate } from './validate';
export { resolve } from './resolve';
export { transform } from './transform';
export { codegen } from './codegen';
export { detectDrift, syncCodeToSpec, syncSpecToCode } from './sync';
export { compileIncremental, invalidateCache } from './incremental';
export * from './plugins';
