/**
 * SPECLANG-GENERATED: Validate command
 * Source: @speclang/mcp.cli
 */

import { readFile } from 'fs/promises';
import { parseSpecContent } from '../../../parser.spec.dir/src/header';
import { validateAllSpecs, findSpecFiles } from '../../../parser.spec.dir/src/validator';
import { autonomousRule } from '../../../validation.spec.dir/src/rules/autonomous';
import { validateIndexCmd, generateIndex } from '../../../indexer.spec.dir/src/index.js';
import { getSpecsDir } from '../utils.js';
import type { SpecIndex } from '../../../indexer.spec.dir/src/types.js';
import type { ParsedSpec } from '../../../parser.spec.dir/src/types';

export interface ValidateOptions {
  fix?: boolean;
  json?: boolean;
  verbose?: boolean;
  type?: 'basic' | 'language-blocks' | 'autonomous';
}

/**
 * Load index from file or generate
 */
function loadIndex(): SpecIndex {
  try {
    return generateIndex({ rootDir: getSpecsDir() });
  } catch {
    return generateIndex({ rootDir: getSpecsDir() });
  }
}

/**
 * Validate command implementation
 */
export async function validateCommand(options: ValidateOptions): Promise<void> {
  const specsDir = getSpecsDir();
  
  // Validate index first
  const index = loadIndex();
  const indexValid = validateIndexCmd(index);
  
  if (!options.json) {
    console.log('\n=== Spec File Validation ===\n');
  }
  
  // Find and validate all specs with basic validation
  const report = validateAllSpecs(specsDir);
  
  const results = report.results || [];
  const errors = results.filter(r => r.errors && r.errors.length > 0);
  const warnings = results.filter(r => r.warnings && r.warnings.length > 0 && (!r.errors || r.errors.length === 0));
  const valid = results.filter(r => (!r.errors || r.errors.length === 0) && (!r.warnings || r.warnings.length === 0));
  
  // If type includes autonomous, run autonomous validation
  let autonomousErrors: any[] = [];
  let autonomousWarnings: any[] = [];
  if (options.type === 'autonomous') {
    // Parse all specs for autonomous validation
    const specFiles = findSpecFiles(specsDir);
    for (const filepath of specFiles) {
      try {
        const content = await readFile(filepath, 'utf-8');
        const parsed = parseSpecContent(content, filepath);
        // Run autonomous rule
        const autonomousResults = autonomousRule.check(parsed as any);
        autonomousResults.forEach(result => {
          if (result.level === 'error') {
            autonomousErrors.push({ filepath, message: result.message });
          } else {
            autonomousWarnings.push({ filepath, message: result.message });
          }
        });
      } catch (error) {
        console.error(`Failed to parse ${filepath}:`, error);
      }
    }
  }
  
  // Combine results
  const allErrors = [...errors, ...autonomousErrors];
  const allWarnings = [...warnings, ...autonomousWarnings];
  
  if (options.json) {
    console.log(JSON.stringify({
      index: {
        valid: indexValid,
        total_specs: index.validation?.total_specs || 0,
        missing_refs: index.validation?.missing_refs || [],
        cycles: index.cycles || [],
      },
      specs: {
        total: report.total || 0,
        valid: valid.length,
        warnings: allWarnings.length,
        errors: allErrors.length,
        details: results.map(r => ({
          filepath: r.filepath,
          errors: r.errors.map(e => e.message),
          warnings: r.warnings.map(w => w.message),
        })),
      },
      autonomous: options.type === 'autonomous' ? {
        errors: autonomousErrors.map(e => ({ filepath: e.filepath, message: e.message })),
        warnings: autonomousWarnings.map(w => ({ filepath: w.filepath, message: w.message })),
      } : undefined,
    }, null, 2));
  } else {
    console.log(`Total spec files: ${report.total || 0}`);
    console.log(`Valid: ${valid.length}`);
    console.log(`Warnings: ${allWarnings.length}`);
    console.log(`Errors: ${allErrors.length}`);
    
    if (allErrors.length > 0) {
      console.log('\n❌ Errors:');
      allErrors.forEach(e => {
        console.log(`\n  ${e.filepath}:`);
        console.log(`    - ${e.message}`);
      });
    }
    
    if (options.verbose && allWarnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      allWarnings.forEach(w => {
        console.log(`\n  ${w.filepath}:`);
        console.log(`    - ${w.message}`);
      });
    }
    
    // Summary
    if (allErrors.length === 0 && allWarnings.length === 0) {
      console.log('\n✅ All specs valid');
    } else if (allErrors.length === 0) {
      console.log('\n⚠️  Specs valid with warnings');
    } else {
      console.log('\n❌ Validation failed');
      process.exit(1);
    }
  }
}

export default validateCommand;
