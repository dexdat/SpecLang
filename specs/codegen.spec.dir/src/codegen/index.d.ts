/**
 * SPECLANG-GENERATED: Main codegen module
 * Source: @speclang/codegen @block:main
 */
export * from './types';
export { parseCodeSpec, parseCodeSpecContent, findCodeSpecFiles, specHasCodeBlocks } from './parser';
export { mapType, getStdlibTypes, isStdlibType, getTypeMapping, TYPE_MAPPINGS } from './mapper';
export { renderTemplate, getTemplate, getTemplateNames, listTemplates, TEMPLATES, createBlockMarker, loadExternalTemplate, getExternalTemplates, clearExternalTemplates, } from './templates';
export { targetRegistry, generateForSpec, getGenerator, isTargetSupported, getSupportedTargets, getAllGenerators, } from './targets';
export type { ITargetGenerator } from './targets';
export { CodeWriter, codeWriter } from './writer';
import { CodeWriter } from './writer';
import type { GenerateResult, TargetLanguage } from './types';
/**
 * Generate code from a spec file
 */
export declare function generate(filepath: string, options?: {
    target?: TargetLanguage;
    outputDir?: string;
    dryRun?: boolean;
}): GenerateResult;
/**
 * Generate code for multiple spec files
 */
export declare function generateAll(filepaths: string[], options?: {
    target?: TargetLanguage;
    outputDir?: string;
    dryRun?: boolean;
}): GenerateResult;
/**
 * Generate code for all specs in a directory
 */
export declare function generateFromDir(dir: string, options?: {
    target?: TargetLanguage;
    outputDir?: string;
    dryRun?: boolean;
    recursive?: boolean;
}): GenerateResult;
export { CodeWriter as Writer };
//# sourceMappingURL=index.d.ts.map