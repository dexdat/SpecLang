/**
 * Assemble all code-pair spec files
 *
 * Reads every .spec.ts.md in specs/ (recursive) and
 * extracts ## Implementation code blocks to .spec.ts files.
 *
 * Supports traceability: each code block gets comments linking
 * back to the spec section it came from.
 *
 * Format:
 *   ### @block:<section-slug> @kind:implementation
 *   ...description...
 *   ## Implementation
 *
 *   ```typescript
 *   ...code...
 *   ```
 *
 * Usage: npx tsx .speclang/assemble-all.ts
 * Output: each .spec.ts.md → corresponding .spec.ts in same dir
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'fast-glob';

interface BlockInfo {
  slug: string;
  kind: string;
  startLine: number;
  endLine: number;
}

interface AssembleResult {
  specFile: string;
  outputFile: string;
  success: boolean;
  error?: string;
  blocksFound: number;
  blocksAssembled: number;
}

/**
 * Parse YAML front matter from a spec file.
 * Returns { id, version } or defaults if not found.
 */
function parseFrontMatter(content: string): { id: string; version: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { id: 'unknown', version: '0.0.0' };

  const yaml = match[1];
  const idMatch = yaml.match(/^id:\s*"?([^"\n]+)"?\s*$/m);
  const verMatch = yaml.match(/^version:\s*"?([^"\n]+)"?\s*$/m);

  return {
    id: idMatch ? idMatch[1].trim() : 'unknown',
    version: verMatch ? verMatch[1].trim() : '0.0.0',
  };
}

/**
 * Find all ### @block:xxx @kind:xxx annotations in the content.
 */
function findBlocks(content: string): BlockInfo[] {
  const blocks: BlockInfo[] = [];
  const blockRegex = /^###\s+@block:(\S+)\s+@kind:(\S+)\s*$/gm;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null) {
    const slug = match[1];
    const kind = match[2];
    // Convert 1-indexed line number
    const lineBefore = content.slice(0, match.index);
    const startLine = (lineBefore.match(/\n/g) || []).length + 1;

    // Find the next ## Implementation after this block annotation
    const rest = content.slice(match.index);
    const implMatch = rest.match(/^## Implementation\s*$/m);
    let endLine = startLine;
    if (implMatch) {
      const implAbsPos = match.index + (implMatch.index || 0);
      const beforeImpl = content.slice(0, implAbsPos);
      // Count lines up to and including ## Implementation
      endLine = (beforeImpl.match(/\n/g) || []).length + 2; // +1 for heading line, +1 for blank
    }

    blocks.push({ slug, kind, startLine, endLine });
  }

  return blocks;
}

/**
 * Find all ## Implementation code blocks and their content.
 * Returns array of { code, startLine, endLine }.
 */
function findImplementationBlocks(content: string): Array<{
  code: string;
  codeStartLine: number;
  codeEndLine: number;
  implHeadingLine: number;
}> {
  const blocks: Array<{
    code: string;
    codeStartLine: number;
    codeEndLine: number;
    implHeadingLine: number;
  }> = [];

  // Match ## Implementation followed by ```typescript
  const regex = /^## Implementation\s*\n\n```typescript\n([\s\S]*?)```/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const code = match[1];
    // Calculate line numbers
    const beforeCode = content.slice(0, match.index);
    const implHeadingLine = (beforeCode.match(/\n/g) || []).length + 1;
    // ```typescript is at implHeadingLine + 2 (## Implementation, blank line, then ```typescript)
    const codeStartLine = implHeadingLine + 3; // code starts on the line after ```typescript
    const codeEndLine = codeStartLine + (code.match(/\n/g) || []).length;

    blocks.push({ code, codeStartLine, codeEndLine, implHeadingLine });
  }

  return blocks;
}

async function assembleOne(specFile: string): Promise<AssembleResult> {
  const outputFile = specFile.replace(/\.spec\.ts\.md$/, '.spec.ts');
  const relativeSpecFile = path.relative(process.cwd(), specFile);

  try {
    const content = await fs.readFile(specFile, 'utf-8');

    // Parse front matter for spec id and version
    const { id: specId, version } = parseFrontMatter(content);

    // Find @block annotations
    const blocks = findBlocks(content);

    // Find ## Implementation code blocks
    const implBlocks = findImplementationBlocks(content);

    if (implBlocks.length === 0) {
      return { specFile, outputFile, success: false, error: 'No ## Implementation code blocks found', blocksFound: blocks.length, blocksAssembled: 0 };
    }

    // If we have @block annotations but they line up with implementation blocks,
    // we map them. Otherwise use generic traceability.
    const codeParts: string[] = [];
    let blocksAssembled = 0;

    if (blocks.length > 0 && blocks.length === implBlocks.length) {
      // One-to-one mapping: each @block maps to one ## Implementation
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const impl = implBlocks[i];

        const traceHeader = [
          `// @spec: ${specId} v${version}`,
          `// @block: ${block.slug} @kind:${block.kind}`,
          `// @source: ${relativeSpecFile}:${impl.codeStartLine}-${impl.codeEndLine}`,
          '',
        ].join('\n');

        codeParts.push(traceHeader + impl.code.replace(/\n$/, ''));
        blocksAssembled++;
      }
    } else {
      // No block mapping — use generic traceability
      for (const impl of implBlocks) {
        const traceHeader = [
          `// @spec: ${specId} v${version}`,
          `// @source: ${relativeSpecFile}:${impl.codeStartLine}-${impl.codeEndLine}`,
          '',
        ].join('\n');

        codeParts.push(traceHeader + impl.code.replace(/\n$/, ''));
        blocksAssembled++;
      }
    }

    const finalCode = codeParts.join('\n\n') + '\n';

    // Write the output
    await fs.writeFile(outputFile, finalCode, 'utf-8');
    return {
      specFile,
      outputFile,
      success: true,
      blocksFound: blocks.length,
      blocksAssembled,
    };
  } catch (err: any) {
    return {
      specFile,
      outputFile,
      success: false,
      error: err.message,
      blocksFound: 0,
      blocksAssembled: 0,
    };
  }
}

async function main() {
  console.log('=== 🏗️  Assemble All Code-Pair Specs (with Traceability) ===\n');

  // Find all .spec.ts.md files
  const root = path.resolve(__dirname, '..');
  const files = await glob('specs/**/*.spec.ts.md', { cwd: root });
  console.log(`Found ${files.length} code-pair spec files\n`);

  let successCount = 0;
  let failCount = 0;
  let totalBlocks = 0;

  for (const file of files) {
    const result = await assembleOne(file);
    if (result.success) {
      console.log(`  ✅ ${file}`);
      console.log(`     → ${result.outputFile}`);
      console.log(`     📦 ${result.blocksAssembled} block(s) assembled`);
      totalBlocks += result.blocksAssembled;
      successCount++;
    } else {
      console.log(`  ⚠️  ${file}: ${result.error}`);
      failCount++;
    }
  }

  console.log(`\n=== 📊 Summary ===`);
  console.log(`Total specs:      ${files.length}`);
  console.log(`✅ Assembled:      ${successCount}`);
  console.log(`⚠️  Skipped:        ${failCount}`);
  console.log(`📦 Total blocks:   ${totalBlocks}`);
  process.exit(failCount > 0 && successCount === 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Assemble-all failed:', err);
  process.exit(1);
});
