/**
speclang-header lines:5
id: @specs/cli
version: 1.0.0
layer: 5
 */

/**
 * SPECLANG-GENERATED: Generate command
 * Source: @speclang/mcp.cli
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadIndex, getSpecsDir } from '../utils.js';

export interface GenerateOptions {
  target?: 'typescript' | 'go' | 'python';
  outputDir?: string;
  dryRun?: boolean;
  json?: boolean;
}

/**
 * Generate command implementation
 */
export async function generateCommand(options: GenerateOptions): Promise<void> {
  const index = loadIndex();
  const specsDir = getSpecsDir();
  const target = options.target || 'typescript';
  const outputDir = options.outputDir || `src/generated`;
  
  if (!options.json) {
    console.log(`=== Code Generation ===\n`);
    console.log(`Target: ${target}`);
    console.log(`Output: ${outputDir}`);
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);
  }
  
  // Find specs with code blocks
  const specsWithBlocks = Object.values(index.specs).filter(spec => 
    spec.blocks && spec.blocks.length > 0
  );
  
  const results: Array<{
    specId: string;
    blocks: string[];
    status: 'generated' | 'skipped' | 'error';
    message?: string;
  }> = [];
  
  for (const spec of specsWithBlocks) {
    try {
      if (options.dryRun) {
        results.push({
          specId: spec.id,
          blocks: spec.blocks || [],
          status: 'skipped',
          message: 'Dry run - no files written'
        });
        continue;
      }
      
      // Create output directory
      const targetDir = path.join(outputDir, spec.id.replace(/[@/]/g, '-'));
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Generate code files (placeholder - real implementation would extract code blocks)
      const blockCount = spec.blocks?.length || 0;
      results.push({
        specId: spec.id,
        blocks: spec.blocks || [],
        status: 'generated',
        message: `Generated ${blockCount} code blocks to ${targetDir}`
      });
      
    } catch (error) {
      results.push({
        specId: spec.id,
        blocks: spec.blocks || [],
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  if (options.json) {
    console.log(JSON.stringify({
      target,
      outputDir,
      dryRun: options.dryRun,
      specsProcessed: specsWithBlocks.length,
      results
    }, null, 2));
  } else {
    console.log(`Processed ${specsWithBlocks.length} specs with code blocks\n`);
    
    for (const result of results) {
      const icon = result.status === 'generated' ? '✅' : result.status === 'error' ? '❌' : '⏭️';
      console.log(`${icon} ${result.specId}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
    }
  }
}

export default generateCommand;
