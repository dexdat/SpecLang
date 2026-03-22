/**
 * SPECLANG-GENERATED: Check command
 * Source: @speclang/cli.spec.dir/check-command
 */

import { validateCommand } from '../../../validation.spec.dir/src/cli';

export interface CheckOptions {
  files?: string[];
  projectDir?: string;
  strict?: boolean;
  fix?: boolean;
  verbose?: boolean;
  format?: 'text' | 'json' | 'minimal';
}

/**
 * Check command implementation
 */
export async function checkCommand(options: CheckOptions): Promise<void> {
  const {
    files = ['specs/**/*.spec.md'],
    projectDir = process.cwd(),
    strict = false,
    fix = false,
    verbose = false,
    format = 'text'
  } = options;

  if (fix) {
    console.log('⚠️  Auto-fix not yet implemented. Running validation only.');
  }

  await validateCommand({
    files,
    projectDir,
    strict,
    verbose,
    format
  });
}

export default checkCommand;