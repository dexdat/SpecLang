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

  // Dedupe by realpath: glob traverses directory symlinks (e.g.
  // specs/project-layout.spec.dir/config -> ../config.spec.dir/src), so a
  // file reachable through both the real and the symlinked path is matched
  // twice. The shell's `find` (no -L) does not follow dir symlinks, so
  // realpath-deduping keeps the validate count in lockstep with
  // `speclang status` and `find specs ... | wc -l` (SL-GAP-038).
  const seenRealPaths = new Set<string>();
  const uniqueFiles: string[] = [];
  for (const file of allFiles) {
    let realPath: string;
    try {
      realPath = fs.realpathSync(file);
    } catch {
      realPath = file;
    }
    if (!seenRealPaths.has(realPath)) {
      seenRealPaths.add(realPath);
      uniqueFiles.push(file);
    }
  }

  if (uniqueFiles.length === 0) {
    console.warn(
      "⚠️ No spec files found matching specs/**/*.spec.md. Run 'speclang new <name>' to create a project."
    );
  }

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
    success: totalErrors === 0 && uniqueFiles.length > 0,
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
