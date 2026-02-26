/**
speclang-header lines:5
id: @specs/cli
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED: Init command
 * Source: @speclang/mcp.cli
 */

import { initProject, formatInitResult } from '../../project-layout/init.js';

export interface InitOptions {
  name?: string;
  targetDir?: string;
  initGit?: boolean;
  force?: boolean;
  targets?: string[];
  description?: string;
  version?: string;
  json?: boolean;
}

/**
 * Init command implementation
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const {
    name = 'my-project',
    targetDir = process.cwd(),
    initGit = true,
    force = false,
    targets = ['typescript'],
    description = 'Project created with speclang init',
    version = '0.1.0',
    json = false
  } = options;

  try {
    const result = await initProject({
      name,
      targetDir,
      initGit,
      force,
      targets,
      description,
      version,
      json
    });

    console.log(formatInitResult(result, json));

    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    if (json) {
      console.log(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } else {
      console.error('❌ Failed to initialize project:', error);
    }
    process.exit(1);
  }
}

export default initCommand;
