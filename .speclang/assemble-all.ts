/**
 * Assemble all code-pair spec files
 *
 * Reads every .spec.ts.md in specs/ (recursive) and
 * extracts ## Implementation code blocks to .spec.ts files.
 *
 * Usage: npx tsx .speclang/assemble-all.ts
 * Output: each .spec.ts.md → corresponding .spec.ts in same dir
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'fast-glob';

interface AssembleResult {
  specFile: string;
  outputFile: string;
  success: boolean;
  error?: string;
}

async function assembleOne(specFile: string): Promise<AssembleResult> {
  const outputFile = specFile.replace(/\.spec\.ts\.md$/, '.spec.ts');

  try {
    const content = await fs.readFile(specFile, 'utf-8');

    // Find ## Implementation code block
    const implMatch = content.match(/## Implementation\n\n```typescript\n([\s\S]*?)```/);
    if (!implMatch) {
      return { specFile, outputFile, success: false, error: 'No ## Implementation code block found' };
    }

    const code = implMatch[1];

    // Write the output
    await fs.writeFile(outputFile, code, 'utf-8');
    return { specFile, outputFile, success: true };
  } catch (err: any) {
    return { specFile, outputFile, success: false, error: err.message };
  }
}

async function main() {
  console.log('=== Assemble All Code-Pair Specs ===\n');

  // Find all .spec.ts.md files
  const files = await glob('specs/**/*.spec.ts.md', { cwd: path.resolve(__dirname, '..') });
  console.log(`Found ${files.length} code-pair spec files\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const result = await assembleOne(file);
    if (result.success) {
      console.log(`  ✅ ${file} → ${result.outputFile}`);
      successCount++;
    } else {
      console.log(`  ⚠️  ${file}: ${result.error}`);
      failCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total: ${files.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️  Skipped: ${failCount}`);
  process.exit(failCount > 0 && successCount === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Assemble-all failed:', err);
  process.exit(1);
});
