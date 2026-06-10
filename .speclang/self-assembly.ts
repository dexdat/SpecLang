/**
 * Self-Assembly Verification
 * 
 * Runs the assembler on all 6 code-pair specs, saves to .speclang/assembled/,
 * reports success/failure per spec, compares generated vs existing output.
 */
import { Assembler } from './assembler.spec';
import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';

// ---- Config ----

const SPEC_FILES = [
  'specs/assembler/daemon.spec.ts.md',
  'specs/assembler/guard.spec.ts.md',
  'specs/assembler/cascade-router.spec.ts.md',
  'specs/assembler/pipeline.spec.ts.md',
  'specs/assembler/assembler.spec.ts.md',
  'specs/assembler/mcp-server.spec.ts.md',
];

const OUTPUT_DIR = '.speclang/assembled';
const EXISTING_DIR = '.speclang';

// Map spec file to existing output file
const EXISTING_MAP: Record<string, string> = {
  'specs/assembler/daemon.spec.ts.md': '.speclang/daemon.spec.ts',
  'specs/assembler/guard.spec.ts.md': '.speclang/guard.spec.ts',
  'specs/assembler/cascade-router.spec.ts.md': '.speclang/cascade-router.spec.ts',
  'specs/assembler/pipeline.spec.ts.md': '.speclang/pipeline.spec.ts',
  'specs/assembler/assembler.spec.ts.md': '.speclang/assembler.spec.ts',
  'specs/assembler/mcp-server.spec.ts.md': '.speclang/mcp-server.spec.ts',
};

// ---- Helpers ----

function getExpectedOutputPath(specFile: string): string {
  const basename = path.basename(specFile).replace('.spec.ts.md', '.spec.ts');
  return path.join(OUTPUT_DIR, basename);
}

async function compareFiles(generated: string, existing: string): Promise<{ match: boolean; diff: string }> {
  try {
    const genContent = await fs.readFile(generated, 'utf-8');
    const existContent = await fs.readFile(existing, 'utf-8');
    if (genContent === existContent) {
      return { match: true, diff: '' };
    }
    // Generate diff summary
    const genLines = genContent.split('\n');
    const existLines = existContent.split('\n');
    const diffLines: string[] = [];
    const maxLines = Math.max(genLines.length, existLines.length);
    let diffCount = 0;
    for (let i = 0; i < maxLines; i++) {
      const g = genLines[i] ?? '';
      const e = existLines[i] ?? '';
      if (g !== e) {
        diffCount++;
        if (diffLines.length < 10) {
          diffLines.push(`  L${i + 1}: expected=${e.length > 60 ? e.slice(0, 60) + '...' : e} | generated=${g.length > 60 ? g.slice(0, 60) + '...' : g}`);
        }
      }
    }
    const diffSummary = `${diffCount} differing lines${diffLines.length > 0 ? '\n' + diffLines.join('\n') : ''}${diffCount > 10 ? `\n  ... and ${diffCount - 10} more differences` : ''}`;
    return { match: false, diff: diffSummary };
  } catch (err: any) {
    return { match: false, diff: `Could not compare: ${err.message}` };
  }
}

async function getFileSize(filePath: string): Promise<string> {
  try {
    const stat = await fs.stat(filePath);
    return `${stat.size} bytes`;
  } catch {
    return 'N/A';
  }
}

// ---- Main ----

async function main() {
  console.log('=== SpecLang Self-Assembly Verification ===\n');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Node: ${process.version}`);
  console.log(`Output dir: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // We need to temporarily modify output paths for the spec files
  // The assembler reads output from the spec's YAML header
  // So we create temporary copies with modified output paths
  // OR we can assemble individually and redirect

  const assembler = new Assembler();
  let totalSuccess = 0;
  let totalFail = 0;

  for (const specFile of SPEC_FILES) {
    const expectedOut = getExpectedOutputPath(specFile);
    const existingFile = EXISTING_MAP[specFile];

    console.log(`\n--- Processing: ${specFile} ---`);

    // Read spec, modify output path, write temp, assemble temp
    const content = await fs.readFile(specFile, 'utf-8');
    const match = content.match(/^---\n(.*?)\n---\n(.*)$/s);
    if (!match) {
      console.log(`  ❌ Invalid spec format (no front matter)`);
      totalFail++;
      continue;
    }

    let header = match[1];
    const body = match[2];

    // Override output path in header to point to assembled/
    const outputLineRegex = /^output: .*$/m;
    if (outputLineRegex.test(header)) {
      header = header.replace(outputLineRegex, `output: ${expectedOut}`);
    } else {
      header += `\noutput: ${expectedOut}`;
    }

    const tempContent = `---\n${header}\n---\n${body}`;
    const tempFile = `.speclang/tmp-${path.basename(specFile)}`;
    await fs.writeFile(tempFile, tempContent, 'utf-8');

    try {
      const result = await assembler.assemble(tempFile);

      if (result.success) {
        totalSuccess++;
        const size = await getFileSize(result.outputPath!);
        console.log(`  ✅ SUCCESS`);
        console.log(`  Output: ${result.outputPath}`);
        console.log(`  Size: ${size}`);
        result.warnings.forEach(w => console.log(`  ⚠  ${w}`));

        // Compare with existing
        if (existingFile) {
          const { match: same, diff } = await compareFiles(expectedOut, existingFile);
          if (same) {
            console.log(`  🔄 Match with ${existingFile}: ✅ IDENTICAL`);
          } else {
            console.log(`  🔄 Match with ${existingFile}: ❌ DIFFER`);
            console.log(`  Diff summary:\n${diff}`);
          }
        }
      } else {
        totalFail++;
        console.log(`  ❌ FAILED`);
        result.errors.forEach(e => console.log(`  ❌ ${e}`));
        result.warnings.forEach(w => console.log(`  ⚠  ${w}`));
      }
    } catch (err: any) {
      totalFail++;
      console.log(`  ❌ EXCEPTION: ${err.message}`);
    } finally {
      // Clean up temp file
      try { await fs.unlink(tempFile); } catch {}
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${SPEC_FILES.length}`);
  console.log(`✅ Success: ${totalSuccess}`);
  console.log(`❌ Failed: ${totalFail}`);
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Self-assembly failed:', err);
  process.exit(1);
});
