/**
 * SPECLANG-GENERATED: Validation CLI
 * Source: @speclang/validation/cli
 */

import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { parseSpec } from '../parser/header';
import { ValidationEngine } from './engine';
import { ValidationReporter } from './reporter';

export interface ValidateOptions {
  files: string[];
  projectDir: string;
  strict?: boolean;
  verbose?: boolean;
  format?: 'text' | 'json' | 'minimal';
}

export interface ValidateResult {
  success: boolean;
  totalFiles: number;
  passedFiles: number;
  failedFiles: number;
  errors: number;
  warnings: number;
  reports?: any[];
}

export async function validateCommand(options: ValidateOptions): Promise<ValidateResult> {
  const {
    files,
    projectDir,
    strict = false,
    verbose = false,
    format = 'text'
  } = options;

  const engine = new ValidationEngine({ strict });
  const reporter = new ValidationReporter(verbose);

  const allFiles: string[] = [];
  
  for (const pattern of files) {
    const resolvedPattern = path.isAbsolute(pattern) 
      ? pattern 
      : path.join(projectDir, pattern);
    
    const matched = await glob(resolvedPattern, {
      ignore: ['**/.backup_spec_files/**', '**/node_modules/**']
    });
    allFiles.push(...matched);
  }

  const uniqueFiles = [...new Set(allFiles)];

  const reports: any[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let passedFiles = 0;

  for (const file of uniqueFiles) {
    try {
      const parsed = parseSpec(file);
      
      const report = await engine.validate(parsed);
      reports.push(report);
      
      if (report.passed) {
        passedFiles++;
      }
      
      totalErrors += report.errors.length;
      totalWarnings += report.warnings.length;
      
      if (format === 'text' || format === 'minimal') {
        const output = format === 'minimal'
          ? reporter.formatMinimal([report])
          : reporter.format(report);
        console.log(output);
      }
    } catch (error) {
      console.error(`Error validating ${file}:`, (error as Error).message);
      totalErrors++;
    }
  }

  const result: ValidateResult = {
    success: totalErrors === 0,
    totalFiles: uniqueFiles.length,
    passedFiles,
    failedFiles: uniqueFiles.length - passedFiles,
    errors: totalErrors,
    warnings: totalWarnings,
    reports: format === 'json' ? reports : undefined
  };

  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('\n────────────────────────────────────────');
    console.log(`Validation Summary: ${uniqueFiles.length} files`);
    console.log(`  ✅ Passed: ${passedFiles}`);
    console.log(`  ❌ Failed: ${uniqueFiles.length - passedFiles}`);
    console.log(`  Errors: ${totalErrors}`);
    console.log(`  Warnings: ${totalWarnings}`);
  }

  return result;
}

export default validateCommand;
