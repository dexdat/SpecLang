/**
 * SPECLANG-GENERATED: Main codegen module
 * Source: @speclang/codegen @block:main
 */

// Types
export * from './types';

// Parser
export { parseCodeSpec, parseCodeSpecContent, findCodeSpecFiles, specHasCodeBlocks } from './parser';

// Mapper
export { mapType, getStdlibTypes, isStdlibType, getTypeMapping, TYPE_MAPPINGS } from './mapper';

// Templates
export { renderTemplate, getTemplate, getTemplateNames, listTemplates, TEMPLATES } from './templates';

// Targets
export {
  targetRegistry,
  generateForSpec,
  getGenerator,
  isTargetSupported,
  getSupportedTargets,
  getAllGenerators,
} from './targets';
export type { ITargetGenerator } from './targets';

// Writer
export { CodeWriter, codeWriter } from './writer';

// ============================================================================
// MAIN CODE GENERATION FUNCTION
// ============================================================================

import { parseCodeSpec } from './parser';
import { generateForSpec } from './targets';
import { codeWriter, CodeWriter } from './writer';
import type { CodeSpec, GeneratedFile, GenerateResult, TargetLanguage } from './types';

/**
 * Generate code from a spec file
 */
export function generate(filepath: string, options?: {
  target?: TargetLanguage;
  outputDir?: string;
  dryRun?: boolean;
}): GenerateResult {
  const timestamp = new Date().toISOString();
  
  try {
    // Parse spec
    const spec = parseCodeSpec(filepath);
    
    // Override target if specified
    if (options?.target) {
      spec.target.language = options.target;
    }
    if (options?.outputDir) {
      spec.target.outputPath = options.outputDir;
    }
    
    // Generate code
    const files = generateForSpec(spec);
    
    // Write files
    const writeResult = codeWriter.write(files, { dryRun: options?.dryRun });
    
    return {
      generated: files,
      skipped: writeResult.skipped,
      errors: writeResult.errors,
      timestamp,
    };
  } catch (error) {
    return {
      generated: [],
      skipped: [],
      errors: [{
        file: filepath,
        error: error instanceof Error ? error.message : 'Unknown error',
      }],
      timestamp,
    };
  }
}

/**
 * Generate code for multiple spec files
 */
export function generateAll(
  filepaths: string[],
  options?: {
    target?: TargetLanguage;
    outputDir?: string;
    dryRun?: boolean;
  }
): GenerateResult {
  const allFiles: GeneratedFile[] = [];
  const allErrors: Array<{ file: string; error: string }> = [];
  const allSkipped: string[] = [];
  
  for (const filepath of filepaths) {
    const result = generate(filepath, options);
    allFiles.push(...result.generated);
    allErrors.push(...result.errors);
    allSkipped.push(...result.skipped);
  }
  
  // Write all files at once
  if (!options?.dryRun && allFiles.length > 0) {
    const writeResult = codeWriter.write(allFiles);
    return {
      generated: allFiles,
      skipped: [...allSkipped, ...writeResult.skipped],
      errors: [...allErrors, ...writeResult.errors],
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    generated: allFiles,
    skipped: allSkipped,
    errors: allErrors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate code for all specs in a directory
 */
export function generateFromDir(
  dir: string,
  options?: {
    target?: TargetLanguage;
    outputDir?: string;
    dryRun?: boolean;
    recursive?: boolean;
  }
): GenerateResult {
  const { findCodeSpecFiles } = require('./parser');
  const files = findCodeSpecFiles(dir, options?.recursive ?? true);
  return generateAll(files, options);
}

// Re-export writer for direct usage
export { CodeWriter as Writer };
