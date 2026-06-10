/**
 * Self-Host Verification Gate — SpecLang's Final Proof
 *
 * Step 1: Re-assemble all 6 code-pair specs using Assembler.assembleAll()
 * Step 2: Run all tests against hand-extracted files (.speclang/*.spec.ts)
 * Step 3: Run all tests against assembled files (.speclang/assembled/*.spec.ts)
 * Step 4: Compare results — if assembled passes the same tests as hand, we win
 * Step 5: Report pass/fail per component, expected vs actual
 *
 * Usage:
 *   npx tsx .speclang/self-host-verify.ts
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { runAll } from './self-host-harness';

// ---- Config ----

const ASSEMBLER_SPEC_PATH = path.join(__dirname, 'assembler.spec');

// The 6 code-pair spec files
const SPEC_FILES = [
  'specs/assembler/daemon.spec.ts.md',
  'specs/assembler/guard.spec.ts.md',
  'specs/assembler/cascade-router.spec.ts.md',
  'specs/assembler/pipeline.spec.ts.md',
  'specs/assembler/assembler.spec.ts.md',
  'specs/assembler/mcp-server.spec.ts.md',
];

const ASSEMBLED_DIR = path.join(__dirname, 'assembled');
const HAND_DIR = __dirname;

// Which component file each spec produces
const COMPONENT_MAP: Record<string, string> = {
  'specs/assembler/daemon.spec.ts.md': 'daemon',
  'specs/assembler/guard.spec.ts.md': 'guard',
  'specs/assembler/cascade-router.spec.ts.md': 'cascade-router',
  'specs/assembler/pipeline.spec.ts.md': 'pipeline',
  'specs/assembler/assembler.spec.ts.md': 'assembler',
  'specs/assembler/mcp-server.spec.ts.md': 'mcp-server',
};

const TEMP_DIR = path.join(__dirname, 'tmp-self-host-verify');

// ---- Helpers ----

function getExpectedOutputPath(specFile: string): string {
  const basename = path.basename(specFile).replace('.spec.ts.md', '.spec.ts');
  return path.join(ASSEMBLED_DIR, basename);
}

function getExistingFile(specFile: string): string {
  const component = COMPONENT_MAP[specFile];
  return path.join(HAND_DIR, `${component}.spec.ts`);
}

// ---- Step 1: Re-assemble ----

async function step1Reassemble(): Promise<boolean> {
  console.log('\n═══ STEP 1: Re-assemble all 6 code-pair specs ═══\n');

  // Load the assembler
  const { Assembler } = require(ASSEMBLER_SPEC_PATH);
  const assembler = new Assembler();

  // Ensure assembled directory exists
  await fs.mkdir(ASSEMBLED_DIR, { recursive: true });

  // Also create temp dir for modified specs
  await fs.mkdir(TEMP_DIR, { recursive: true });

  let successCount = 0;
  let failCount = 0;
  const assemblyResults: Array<{ spec: string; success: boolean; match: boolean; diff: string }> = [];

  for (const specFile of SPEC_FILES) {
    const expectedOut = getExpectedOutputPath(specFile);
    const existingFile = getExistingFile(specFile);

    console.log(`  Processing: ${specFile}...`);

    // Read spec, modify output path to point to assembled/
    const content = await fs.readFile(specFile, 'utf-8');
    const match = content.match(/^---\n(.*?)\n---\n(.*)$/s);

    if (!match) {
      console.log(`    ❌ Invalid spec format (no front matter)`);
      failCount++;
      assemblyResults.push({ spec: specFile, success: false, match: false, diff: 'No front matter' });
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
    const tempFile = path.join(TEMP_DIR, path.basename(specFile));
    await fs.writeFile(tempFile, tempContent, 'utf-8');

    try {
      const result = await assembler.assemble(tempFile);

      if (result.success) {
        successCount++;
        console.log(`    ✅ Assembled → ${result.outputPath}`);

        // Compare with hand-extracted file
        const genContent = await fs.readFile(expectedOut, 'utf-8');
        const existContent = await fs.readFile(existingFile, 'utf-8');
        const identical = genContent === existContent;

        if (identical) {
          console.log(`    🔄 Match with ${existingFile}: ✅ IDENTICAL`);
        } else {
          console.log(`    🔄 Match with ${existingFile}: ❌ DIFFER`);
        }

        assemblyResults.push({ spec: specFile, success: true, match: identical, diff: identical ? '' : 'Files differ (content comparison)' });
      } else {
        failCount++;
        console.log(`    ❌ Assembly failed: ${result.errors.join('; ')}`);
        assemblyResults.push({ spec: specFile, success: false, match: false, diff: result.errors.join('; ') });
      }
    } catch (err: any) {
      failCount++;
      console.log(`    ❌ Exception: ${err.message}`);
      assemblyResults.push({ spec: specFile, success: false, match: false, diff: err.message });
    } finally {
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {});
    }
  }

  console.log(`\n  Assembled: ${successCount}/${SPEC_FILES.length} successful`);

  const allMatch = assemblyResults.every((r) => r.success && r.match);
  if (allMatch) {
    console.log(`  All 6 assembled files match hand-extracted: ✅`);
  } else {
    const mismatches = assemblyResults.filter((r) => !r.success || !r.match);
    console.log(`  Mismatches: ${mismatches.length}`);
    for (const m of mismatches) {
      console.log(`    ❌ ${m.spec}: ${m.diff}`);
    }
  }

  return allMatch && failCount === 0;
}

// ---- Step 2: Run tests on hand-extracted code ----

async function step2TestHand(): Promise<{ passed: number; failed: number; results: Record<string, boolean> }> {
  console.log('\n═══ STEP 2: Run all tests on hand-extracted code ═══');
  return runAll('hand');
}

// ---- Step 3: Run tests on assembled code ----

async function step3TestAssembled(): Promise<{ passed: number; failed: number; results: Record<string, boolean> }> {
  console.log('\n═══ STEP 3: Run all tests on assembled code ═══');
  return runAll('assembled');
}

// ---- Step 4: Compare results ----

interface CompareResult {
  allMatch: boolean;
  details: Array<{
    component: string;
    handPassed: boolean;
    assembledPassed: boolean;
    match: boolean;
  }>;
}

function step4Compare(hand: { results: Record<string, boolean> }, assembled: { results: Record<string, boolean> }): CompareResult {
  console.log('\n═══ STEP 4: Compare hand vs assembled results ═══\n');

  const allComponents = Object.keys(hand.results);
  const details: CompareResult['details'] = [];

  for (const component of allComponents) {
    const handPassed = hand.results[component];
    const assembledPassed = assembled.results[component];
    const match = handPassed === assembledPassed;

    details.push({ component, handPassed, assembledPassed, match });

    if (match && handPassed) {
      console.log(`  ✅ ${component}: both passed`);
    } else if (match && !handPassed) {
      console.log(`  ⚠️  ${component}: both failed (hand and assembled agree)`);
    } else {
      console.log(`  ❌ ${component}: hand=${handPassed ? 'PASS' : 'FAIL'} vs assembled=${assembledPassed ? 'PASS' : 'FAIL'}`);
    }
  }

  const allMatch = details.every((d) => d.match);
  console.log(`\n  All components match: ${allMatch ? '✅ YES' : '❌ NO'}`);

  return { allMatch, details };
}

// ---- Step 5: Summary ----

function step5Summary(
  assemblyOk: boolean,
  hand: { passed: number; failed: number },
  assembled: { passed: number; failed: number },
  compare: CompareResult
): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log('  SELF-HOSTING VERIFICATION GATE');
  console.log(`${'='.repeat(60)}\n`);

  console.log(`  📦 Assembly:           ${assemblyOk ? '✅ All 6 assembled and match' : '❌ Assembly issues'}`);
  console.log(`  ✋ Hand-extracted:      ${hand.passed} passed, ${hand.failed} failed`);
  console.log(`  🤖 Assembled:           ${assembled.passed} passed, ${assembled.failed} failed`);
  console.log(`  🔄 Functional parity:   ${compare.allMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

  console.log('');

  if (assemblyOk && compare.allMatch && assembled.failed === 0) {
    console.log('  ✅ SELF-HOSTING VERIFIED: SpecLang can rebuild itself');
    console.log('     All 6 code-pair specs were assembled correctly,');
    console.log('     and the generated code passes the same tests as hand-extracted code.\n');
  } else {
    console.log('  ❌ SELF-HOSTING NOT VERIFIED');
    console.log('     SpecLang cannot yet rebuild itself reliably.\n');

    if (!assemblyOk) {
      console.log('     Assembly issues: some generated files differ from hand-extracted.');
    }
    if (!compare.allMatch) {
      console.log('     Functional parity issues:');
      for (const d of compare.details) {
        if (!d.match) {
          console.log(`       ${d.component}: hand=${d.handPassed ? 'PASS' : 'FAIL'} vs assembled=${d.assembledPassed ? 'PASS' : 'FAIL'}`);
        }
      }
    }
    console.log('');
  }

  // Print detailed component table
  console.log('  Component-level results:');
  console.log(`  ${'─'.repeat(50)}`);
  for (const d of compare.details) {
    const status = d.match && d.assembledPassed ? '✅' : '❌';
    console.log(`  ${status} ${d.component.padEnd(16)} hand: ${d.handPassed ? 'PASS' : 'FAIL'.padEnd(4)} assembled: ${d.assembledPassed ? 'PASS' : 'FAIL'}`);
  }
  console.log(`  ${'─'.repeat(50)}\n`);
}

// ---- Main ----

async function main() {
  console.log('='.repeat(60));
  console.log('  Self-Host Verification Gate');
  console.log(`  ${new Date().toISOString()}`);
  console.log(`  Node: ${process.version}`);
  console.log('='.repeat(60));

  let overallSuccess = true;

  try {
    // Step 1: Re-assemble
    const assemblyOk = await step1Reassemble();
    if (!assemblyOk) {
      console.log('\n⚠️  Assembly step had issues, but proceeding with comparison...');
    }

    // Step 2: Test hand-extracted
    const hand = await step2TestHand();

    // Step 3: Test assembled
    const assembled = await step3TestAssembled();

    // Step 4: Compare
    const compare = step4Compare(hand, assembled);

    // Step 5: Summary
    step5Summary(assemblyOk, hand, assembled, compare);

    overallSuccess = assemblyOk && compare.allMatch && assembled.failed === 0;
  } catch (err: any) {
    console.error(`\n❌ Fatal error: ${err.message}`);
    console.error(err.stack);
    overallSuccess = false;
  } finally {
    // Clean up temp directory
    await fs.rm(TEMP_DIR, { recursive: true, force: true }).catch(() => {});
    console.log('  Cleanup: temp files removed');
  }

  process.exit(overallSuccess ? 0 : 1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('FATAL:', err);
    process.exit(1);
  });
}
