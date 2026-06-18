/**
 * Verify All — runs all 5 spec test files and reports pass/fail counts
 * 
 * Run: npx tsx .speclang/verify-all.ts
 */
import { execSync } from 'child_process';

interface TestResult {
  name: string;
  exitCode: number;
  output: string;
}

const TESTS = [
  { name: 'test-daemon', file: '.speclang/test-daemon.ts' },
  { name: 'test-guard', file: '.speclang/test-guard.ts' },
  { name: 'test-cascade-router', file: '.speclang/test-cascade-router.ts' },
  { name: 'test-pipeline', file: '.speclang/test-pipeline.ts' },
  { name: 'test-mcp-server', file: '.speclang/test-mcp-server.ts' },
];

function runTest(test: { name: string; file: string }): TestResult {
  console.log(`\n--- Running: ${test.name} (${test.file}) ---`);
  try {
    const output = execSync(`npx tsx ${test.file} 2>&1`, {
      encoding: 'utf-8',
      timeout: 60000,
    });
    console.log(output);
    return { name: test.name, exitCode: 0, output };
  } catch (err: any) {
    const output = err.stdout || '';
    const stderr = err.stderr || '';
    console.log(output);
    if (stderr) console.error(stderr);
    return { name: test.name, exitCode: err.status ?? 1, output: output + stderr };
  }
}

function summarizeResults(results: TestResult[]): void {
  console.log('\n=== VERIFY ALL SUMMARY ===');
  let totalPassed = 0;
  let totalFailed = 0;
  let totalAssertions = 0;

  for (const r of results) {
    // Parse assertion counts from output: "Tests: N passed, M failed"
    const passMatch = r.output.match(/(\d+) passed/);
    const failMatch = r.output.match(/(\d+) failed/);
    const testPassed = passMatch ? parseInt(passMatch[1]) : 0;
    const testFailed = failMatch ? parseInt(failMatch[1]) : 0;
    totalAssertions += testPassed + testFailed;

    if (r.exitCode === 0) {
      totalPassed++;
      console.log(`  ✅ ${r.name}: PASSED (${testPassed} passed${testFailed > 0 ? `, ${testFailed} failed` : ''})`);
    } else {
      totalFailed++;
      console.log(`  ❌ ${r.name}: FAILED (exit code ${r.exitCode}) (${testPassed} passed, ${testFailed} failed)`);
    }
  }

  console.log(`\n--- Final ---`);
  console.log(`Test suites: ${totalPassed}/${results.length} passed`);
  console.log(`Total assertions: ${totalAssertions}`);
  process.exit(totalFailed > 0 ? 1 : 0);
}

console.log('=== SpecLang Verify All ===');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Node: ${process.version}\n`);

const results = TESTS.map(runTest);
summarizeResults(results);
